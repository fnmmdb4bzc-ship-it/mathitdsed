import { createRemoteJWKSet, jwtVerify } from 'jose';
import { query } from './db.js';

const ISSUER = process.env.KEYCLOAK_ISSUER;              // what the token claims
const INTERNAL = process.env.KEYCLOAK_INTERNAL_URL;      // how we reach Keycloak
const REALM = process.env.KEYCLOAK_REALM || 'mathit';

// The browser talks to Keycloak on localhost:8081 while we reach it at
// keycloak:8080 inside the compose network. So we fetch keys over the internal
// URL but still verify `iss` against the public one the token was minted with.
const JWKS = createRemoteJWKSet(
  new URL(`${INTERNAL}/realms/${REALM}/protocol/openid-connect/certs`),
);

async function verify(token) {
  const { payload } = await jwtVerify(token, JWKS, { issuer: ISSUER });
  return payload;
}

function bearer(req) {
  const h = req.get('authorization') || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

const rolesOf = claims => claims?.realm_access?.roles || [];

/**
 * Verifies the token and hangs the caller's identity off req.auth.
 *
 * Everything downstream derives the student from req.auth.sub - never from a
 * body or query parameter. That is what keeps one student from reading
 * another's data even if they forge an id in the request.
 */
export async function authenticate(req, res, next) {
  const token = bearer(req);
  if (!token) return res.status(401).json({ error: 'missing bearer token' });

  try {
    const claims = await verify(token);
    req.auth = {
      sub: claims.sub,
      username: claims.preferred_username || claims.sub,
      email: claims.email || null,
      name: claims.name || claims.given_name || claims.preferred_username || 'Student',
      roles: rolesOf(claims),
    };
    next();
  } catch (err) {
    res.status(401).json({ error: 'invalid token', detail: err.message });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.auth?.roles.includes(role)) {
      return res.status(403).json({ error: `requires the '${role}' role` });
    }
    next();
  };
}

/**
 * Resolves req.auth to a row in students, creating it on first sight.
 *
 * Self-registration happens in Keycloak, which means the first time we ever see
 * a token we may have no row yet. We create it as 'pending' - the account
 * exists but is inert until an admin approves it.
 */
export async function loadStudent(req, res, next) {
  const { sub, username, email, name, roles } = req.auth;
  // Admins reach authenticated pages too. Give them an active row flagged
  // is_admin, so they neither sit in the roster as a student awaiting
  // approval nor get blocked by requireActive.
  const isAdmin = roles.includes('admin');
  try {
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
      [sub, username, email, name, isAdmin],
    );
    req.student = rows[0];
    next();
  } catch (err) {
    next(err);
  }
}

/** Blocks students who exist but have not been approved (or were disabled). */
export function requireActive(req, res, next) {
  if (req.student.status !== 'active') {
    return res.status(403).json({
      error: 'account not active',
      status: req.student.status,
      message: req.student.status === 'pending'
        ? 'Your account is waiting for approval by the practice admin.'
        : 'Your account has been disabled. Please contact the practice.',
    });
  }
  next();
}
