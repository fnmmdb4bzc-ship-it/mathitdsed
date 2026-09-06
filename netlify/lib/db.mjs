/**
 * Database access, on Netlify Database.
 *
 * getDatabase() is the supported way to reach it: deployed, it hands back
 * Neon's HTTP client, which holds no connection between calls - the property
 * that made a pg.Pool the wrong choice here, since every cold function instance
 * would open its own connections and never close them. Run under `netlify dev`
 * the same call returns a pg.Pool against the local Postgres instead. Both
 * shapes are handled below, so the routes are indifferent to which is live.
 *
 * DATABASE_URL still wins when it is set, which is how this runs against the
 * docker-compose Postgres.
 *
 * The connection is resolved on first query rather than at import. Resolving it
 * at import means an unconfigured project answers 500 on *every* route
 * including /health, which hides the actual problem; this way /health reports
 * it.
 */
import { getDatabase } from '@netlify/database';

let conn = null;

function connection() {
  if (conn) return conn;
  const override = process.env.DATABASE_URL;
  conn = getDatabase(override ? { connectionString: override } : undefined);
  return conn;
}

/**
 * query(text, params) -> { rows, rowCount }.
 *
 * Both drivers are asked for pg's result shape, so every SQL statement in
 * routes/ is unchanged from the Express version. `.query(text, params, opts)`
 * is the Neon HTTP driver's documented form for $1-style parameters.
 */
export async function query(text, params = []) {
  const db = connection();
  return db.driver === 'serverless'
    ? db.httpClient.query(text, params, { fullResults: true })
    : db.pool.query(text, params);
}
