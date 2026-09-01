/**
 * Token verification and student resolution.
 *
 * Provider-agnostic on purpose. backend/src/auth.js hardcoded Keycloak's
 * /realms/{realm}/protocol/openid-connect/certs path; here the JWKS URL comes
 * out of the issuer's own OIDC discovery document, so pointing OIDC_ISSUER at
 * Keycloak, Clerk or anything else that speaks OIDC is a config change rather
 * than a code change.
 *
 * The compose-era split between "public issuer" and "internal URL" is gone.
 * There is no private network here: the browser and the function reach the
 * same issuer at the same address.
 */
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { query } from './db.mjs';

const ISSUER = process.env.OIDC_ISSUER;
if (!ISSUER) throw new Error('OIDC_ISSUER is not set');

/**
 * Discovery, memoised per warm function instance. Costs one extra fetch on a
 * cold start and nothing afterwards. Worth it: it is what lets the frontend
 * stop knowing any provider-specific URL shapes (see /api/config).
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

let jwks = null;
async function keys() {
  if (!jwks) jwks = createRemoteJWKSet(new URL((await discover()).jwks_uri));
  return jwks;
}

/**
 * Roles, across providers.
 *
 * Keycloak puts them in realm_access.roles. Clerk and friends use a custom
 * claim, conventionally namespaced. Checking a few known shapes keeps this
 * file the only place that has to change when the provider does.
 */
const rolesOf = c =>
  c?.realm_access?.roles
  ?? c?.[process.env.OIDC_ROLES_CLAIM || 'roles']
  ?? c?.metadata?.roles
  ?? [];

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

  let claims;
  try {
    ({ payload: claims } = await jwtVerify(token, await keys(), { issuer: ISSUER }));
  } catch (err) {
    throw new HttpError(401, 'invalid token', { detail: err.message });
  }

  return {
    sub: claims.sub,
    username: claims.preferred_username || claims.username || claims.sub,
    email: claims.email || null,
    name: claims.name || claims.given_name || claims.preferred_username || 'Student',
    roles: rolesOf(claims),
  };
}

export function requireRole(auth, role) {
  if (!auth.roles.includes(role)) throw new HttpError(403, `requires the '${role}' role`);
}

/**
 * Resolves the token to a students row, creating it on first sight.
 *
 * Unchanged from backend/src/auth.js, including the column name: keycloak_id
 * still holds the identity provider's subject claim whoever issues it. Renaming
 * it to provider_id would be tidier and is a one-line migration, but it is a
 * cosmetic change and this draft keeps the schema untouched so the diff stays
 * about the architecture.
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

/** Blocks students who exist but have not been approved (or were disabled). */
export function requireActive(student) {
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
