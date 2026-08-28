import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const MIGRATIONS = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations');

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});

export const query = (text, params) => pool.query(text, params);

/** Waits for Postgres to accept connections; compose health checks can still race us. */
export async function waitForDb(attempts = 30) {
  for (let i = 1; i <= attempts; i++) {
    try {
      await pool.query('SELECT 1');
      return;
    } catch (err) {
      if (i === attempts) throw err;
      console.log(`  db not ready (${err.code || err.message}), retry ${i}/${attempts}`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

/**
 * Applies every migrations/NNN_*.sql once, in filename order, recording each in
 * schema_migrations. Files starting with 000_ are for the Postgres init hook
 * (they use psql-only syntax such as \gexec) and are skipped here.
 */
export async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const files = (await readdir(MIGRATIONS))
    .filter(f => f.endsWith('.sql') && !f.startsWith('000_'))
    .sort();

  for (const file of files) {
    const { rowCount } = await pool.query(
      'SELECT 1 FROM schema_migrations WHERE filename = $1', [file],
    );
    if (rowCount) continue;

    const sql = await readFile(join(MIGRATIONS, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`  applied migration ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`migration ${file} failed: ${err.message}`);
    } finally {
      client.release();
    }
  }
}
