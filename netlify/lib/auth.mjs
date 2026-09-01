/**
 * Student resolution and authorisation.
 *
 * Token *verification* is not here. It moved into netlify/lib/identity/,
 * because it turned out to be provider-shaped in a way the original design
 * assumed it was not: Keycloak issues JWTs that are verified locally against a
 * JWKS, while Clerk's OIDC access tokens are opaque handles (`oat_...`) that
 * have to be introspected over the network. Those are different enough that
 * pretending they share an implementation would have meant a branch in the
 * middle of this file. The adapter exposes verifyToken() and everything below
 * works from its result.
 */
import { verifyToken } from './identity/index.mjs';
import { query } from './db.mjs';

const ISSUER = process.env.OIDC_ISSUER;
if (!ISSUER) throw new Error('OIDC_ISSUER is not set');

/**
 * OIDC discovery, memoised per warm function instance.
 *
 * Used only to tell the frontend where to send the browser (see /api/config).
 * Both Keycloak and Clerk publish /.well-known/openid-configuration, so this
 * stays provider-neutral even though verification no longer is.
 */
let discoveryPromise = null;
export function discover() {
  discoveryPromise ??= fetch(`${ISSUER.replace(/\/$/, '')}/.well-known/openid-configuration`)
    .then(res => {
      if (!res.ok) throw new Error(`OIDC discovery failed: ${res.status}`);
      return res.json();
    })
    .catch(err => { discoveryPromise = null; throw err; });  // don't cache failures
  return discoveryPromise;
}

export class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    Object.assign(this, extra);
  }
}

/** Verifies the bearer token and returns the caller's identity. */
export async function authenticate(req) {
  const header = req.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new HttpError(401, 'missing bearer token');
  return verifyToken(token);
}

export function requireRole(auth, role) {
  if (!auth.roles.includes(role)) throw new HttpError(403, `requires the '${role}' role`);
}

/**
 * Resolves the token to a students row, creating it on first sight.
 *
 * Unchanged from backend/src/auth.js, including the column name: keycloak_id
 * holds the identity provider's subject whoever issues it. Renaming it to
 * provider_id would be tidier and is a one-line migration, but it is cosmetic
 * and this keeps the schema diff to the one column that had to change.
 */
export async function loadStudent(auth) {
  const isAdmin = auth.roles.includes('admin');
  const { rows } = await query(
    `INSERT INTO students (keycloak_id, username, email, display_name, is_admin, status)
          VALUES ($1, $2, $3, $4, $5, CASE WHEN $5 THEN 'active' ELSE 'pending' END)
     ON CONFLICT (keycloak_id) DO UPDATE
           SET username     = EXCLUDED.username,
               email        = EXCLUDED.email,
               is_admin     = EXCLUDED.is_admin,
               status       = CASE WHEN EXCLUDED.is_admin THEN 'active'
                                   ELSE students.status END,
               last_seen_at = now()
       RETURNING *`,
    [auth.sub, auth.username, auth.email, auth.name, isAdmin],
  );
  return rows[0];
}

/**
 * Blocks students who cannot practise yet: not approved, disabled, or still
 * holding the temporary password an admin set for them.
 *
 * The password gate lives here rather than in each route so it cannot be
 * forgotten on a new one. POST /api/me/password deliberately does not call
 * this - it is the one thing a student in that state is allowed to do.
 */
export function requireActive(student) {
  if (student.must_change_password) {
    throw new HttpError(403, 'password change required', {
      body: {
        error: 'password change required',
        mustChangePassword: true,
        message: 'Please choose your own password before you start practising.',
      },
    });
  }
  if (student.status !== 'active') {
    throw new HttpError(403, 'account not active', {
      body: {
        error: 'account not active',
        status: student.status,
        message: student.status === 'pending'
          ? 'Your account is waiting for approval by the practice admin.'
          : 'Your account has been disabled. Please contact the practice.',
      },
    });
  }
}
