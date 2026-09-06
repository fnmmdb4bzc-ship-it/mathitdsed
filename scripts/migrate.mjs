/**
 * Applies netlify/database/migrations/*.sql against a Postgres URL, once each,
 * in order.
 *
 * On Netlify this is no longer the normal path: Netlify Database applies the
 * files in that directory itself, immediately before a deploy is published, and
 * a failure blocks the deploy. This script is for the other cases - the
 * docker-compose Postgres, a scratch database, or checking what a migration
 * does before pushing it.
 *
 * Uses plain `pg` rather than a serverless driver because migration files
 * contain multiple statements per file, which an HTTP driver will not accept in
 * one round trip.
 *
 * backend/migrations/000_databases.sql is deliberately not here: it existed
 * only to create Keycloak's separate database inside the compose Postgres, and
 * running it against Netlify Database would be nonsense.
 */
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import pg from 'pg';

const MIGRATIONS = 'netlify/database/migrations';

const url = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL (or NETLIFY_DATABASE_URL) is not set');
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();

await client.query(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    filename   TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`);

const files = (await readdir(MIGRATIONS)).filter(f => f.endsWith('.sql')).sort();

let applied = 0;
for (const file of files) {
  const { rowCount } = await client.query(
    'SELECT 1 FROM schema_migrations WHERE filename = $1', [file],
  );
  if (rowCount) continue;

  const sql = await readFile(join(MIGRATIONS, file), 'utf8');
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
    await client.query('COMMIT');
    console.log(`  applied ${file}`);
    applied++;
  } catch (err) {
    await client.query('ROLLBACK');
    throw new Error(`migration ${file} failed: ${err.message}`);
  }
}

console.log(applied ? `${applied} migration(s) applied` : 'already up to date');
await client.end();
