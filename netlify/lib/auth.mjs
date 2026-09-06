/**
 * Student resolution and authorisation.
 *
 * Authentication itself is not here. It is provider-shaped in a way the
 * original design assumed it was not - Keycloak issues JWTs verified locally
 * against a JWKS, Clerk issues opaque handles that must be introspected, and
 * Netlify Identity issues neither because its session is a cookie the runtime
 * reads for us. The adapter in netlify/lib/identity/ exposes authenticate(req)
 * and everything below works from its result.
 */
import { authenticate as identityAuthenticate } from './identity/index.mjs';
import { HttpError } from './http.mjs';
import { query } from './db.mjs';

// Re-exported because every route imports it from here.
export { HttpError };

/** Resolves the caller's identity, however this provider proves it. */
export const authenticate = req => identityAuthenticate(req);

export function requireRole(auth, role) {
  if (!auth.roles.includes(role)) throw new HttpError(403, `requires the '${role}' role`);
}

/**
 * Resolves the caller to a students row, creating it on first sight.
 *
 * The column is still called keycloak_id: it holds the identity provider's
 * subject whoever issues it. Renaming it to provider_id would be tidier and is
 * a one-line migration, but it is cosmetic and this keeps the schema diff to
 * the one column that had to change.
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
 * This carries more weight on Netlify Identity than it did on Clerk. Clerk can
 * ban a user, so a disabled student could not sign in at all; GoTrue has no
 * ban, so a disabled student still gets a valid session and this check is the
 * only thing standing between them and the app. It lives here rather than in
 * each route so it cannot be forgotten on a new one. POST /api/me/password
 * deliberately does not call it - it is the one thing a student holding a
 * temporary password is allowed to do.
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
