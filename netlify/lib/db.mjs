/**
 * Database access for the functions.
 *
 * Neon's HTTP driver, not pg.Pool. A pool is actively wrong here: every cold
 * function instance would open its own connections and nothing would ever
 * close them, so a handful of concurrent students could exhaust the database.
 * The HTTP driver holds no connection between calls at all.
 *
 * `fullResults: true` makes the driver return { rows, rowCount, ... } instead
 * of a bare array, which is exactly pg's result shape - so query() is a drop-in
 * for the old one and every SQL statement in routes/ is unchanged from
 * backend/. Calling `sql(text, params)` directly (rather than as a tagged
 * template) is the driver's documented form for $1-style parameters.
 */
import { neon } from '@neondatabase/serverless';

// Netlify DB injects NETLIFY_DATABASE_URL. DATABASE_URL is accepted too so the
// same code runs against the compose Postgres via `netlify dev`.
const url = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
if (!url) throw new Error('NETLIFY_DATABASE_URL / DATABASE_URL is not set');

const sql = neon(url, { fullResults: true });

/** query(text, params) -> { rows, rowCount }, matching the old pg signature. */
export const query = (text, params = []) => sql(text, params);
