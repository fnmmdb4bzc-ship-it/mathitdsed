/**
 * Clerk implementation, written against the Backend API OpenAPI spec
 * (clerk/openapi-specs, bapi/2026-05-12).
 *
 * Three things about Clerk shaped this file, all of them checked against the
 * spec rather than assumed:
 *
 * 1. OIDC access tokens are opaque handles (`oat_...`), not JWTs. There is no
 *    key to verify them against, so verifyToken() introspects over the network.
 *    That is a per-request round trip, which is why there is a cache below.
 *
 * 2. Disabling is ban/unban, not lock/unlock. Lock is the automatic lockout
 *    after failed sign-ins and expires on its own; a tutor disabling a student
 *    means it indefinitely, which is what ban does.
 *
 * 3. There is no "must change password at next sign-in" flag anywhere in the
 *    API. Keycloak's requiredActions: ['UPDATE_PASSWORD'] has no counterpart,
 *    so that rule lives in students.must_change_password and is enforced by
 *    this app. setPassword() is the write half of it.
 */
const BASE   = process.env.CLERK_API_URL || 'https://api.clerk.com/v1';
const SECRET = process.env.CLERK_SECRET_KEY;

// The OAuth application the browser signs in through. Introspection returns the
// client_id a token was issued to; checking it means a token minted for some
// other application on the same Clerk instance cannot be replayed against us.
const CLIENT_ID = process.env.OIDC_CLIENT_ID;

/**
 * How long an introspection result is trusted inside one warm function
 * instance. The trade is latency against revocation lag: a banned student can
 * keep working for at most this long on an already-issued token. A minute is
 * short enough for a practice app and turns a per-request round trip into
 * roughly one per student per minute.
 */
const INTROSPECT_TTL_MS = 60_000;
const CACHE_MAX = 500;
const cache = new Map();

class IdentityError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

async function call(path, { method = 'GET', body } = {}) {
  if (!SECRET) throw new Error('CLERK_SECRET_KEY is not set');

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${SECRET}`,
      'content-type': 'application/json',
    },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });

  if (!res.ok) {
    const text = await res.text();
    const err = new IdentityError(res.status, `clerk ${method} ${path} -> ${res.status} ${text}`);
    // Clerk returns { errors: [{ code, message, long_message }] }. Keeping it
    // parsed lets callers distinguish "username taken" from "password rejected"
    // instead of guessing from the status alone.
    try { err.clerk = JSON.parse(text).errors || []; } catch { err.clerk = []; }
    throw err;
  }
  return res.status === 204 ? null : res.json().catch(() => null);
}

/** Clerk nests emails; the primary one is pointed at by id. */
function primaryEmail(user) {
  const list = user.email_addresses || [];
  const primary = list.find(e => e.id === user.primary_email_address_id) || list[0];
  return primary?.email_address || null;
}

/**
 * Roles come from public_metadata, which is the Clerk-idiomatic place for
 * application authorisation data. Accepts either shape so the dashboard can
 * carry {"role": "admin"} or {"roles": ["admin"]}.
 */
function rolesOf(user) {
  const meta = user.public_metadata || {};
  if (Array.isArray(meta.roles)) return meta.roles;
  return meta.role ? [meta.role] : [];
}

const identityOf = user => ({
  sub: user.id,
  username: user.username || user.id,
  email: primaryEmail(user),
  name: [user.first_name, user.last_name].filter(Boolean).join(' ')
        || user.username
        || 'Student',
  roles: rolesOf(user),
});

/**
 * Introspects an opaque access token and returns the caller's identity.
 *
 * Two calls on a cache miss: verify (authoritative on subject, audience and
 * revocation) then the user record (profile and roles). Introspection alone
 * carries no profile claims, so both are needed.
 */
export async function verifyToken(token) {
  const hit = cache.get(token);
  if (hit && Date.now() < hit.expiresAt) return hit.identity;

  let info;
  try {
    info = await call('/oauth_applications/access_tokens/verify', {
      method: 'POST',
      body: { access_token: token },
    });
  } catch (err) {
    // 400/404 mean "no such token", which is a 401 to our caller, not a 500.
    if (err.status === 400 || err.status === 404) {
      throw new IdentityError(401, 'invalid token');
    }
    throw err;
  }

  if (info?.revoked) throw new IdentityError(401, 'token revoked');
  if (info?.expired) throw new IdentityError(401, 'token expired');
  if (CLIENT_ID && info?.client_id && info.client_id !== CLIENT_ID) {
    throw new IdentityError(401, 'token was issued to a different application');
  }
  if (!info?.subject) throw new IdentityError(401, 'invalid token');

  const identity = identityOf(await call(`/users/${info.subject}`));

  // Bounded: a warm instance seeing many students should not grow forever.
  if (cache.size >= CACHE_MAX) cache.clear();
  cache.set(token, { identity, expiresAt: Date.now() + INTROSPECT_TTL_MS });

  return identity;
}

/**
 * Creates a student. Username-only is deliberate and supported: POST /users has
 * no required fields, and the practice has children with no email of their own.
 *
 * skip_password_checks is on because a tutor is choosing a first password for a
 * child in front of them; the student is then forced to change it on first
 * sign-in by must_change_password, which is where the real protection is.
 */
export async function createUser({ username, email, firstName, lastName, password }) {
  try {
    const user = await call('/users', {
      method: 'POST',
      body: {
        username,
        password,
        skip_password_checks: true,
        first_name: firstName || username,
        last_name: lastName || 'Student',
        ...(email && { email_address: [email] }),
      },
    });
    return user.id;
  } catch (err) {
    if (err.status !== 422) throw err;

    // 422 covers both "that username is taken" and "that password was
    // rejected". Mapping every 422 to 409 told the tutor the wrong thing, so
    // split on Clerk's own error code.
    const codes = (err.clerk || []).map(e => e.code || '');
    if (codes.some(c => c.includes('identifier_exists'))) {
      throw Object.assign(new Error('username or email already exists'), { status: 409 });
    }
    throw Object.assign(new Error(passwordMessage(err)), { status: 400 });
  }
}

export const deleteUser = id => call(`/users/${id}`, { method: 'DELETE' });

export const setUserEnabled = (id, enabled) =>
  call(`/users/${id}/${enabled ? 'unban' : 'ban'}`, { method: 'POST' });

/**
 * Ends every live session. Clerk has no "log out everywhere" call, so this
 * lists the user's active sessions and revokes each. Best-effort by contract:
 * disabling a student must not fail because a session revoke did.
 */
export async function logoutUser(id) {
  try {
    const sessions = await call(`/sessions?user_id=${encodeURIComponent(id)}&status=active`);
    const list = Array.isArray(sessions) ? sessions : (sessions?.data ?? []);
    await Promise.all(
      list.map(s => call(`/sessions/${s.id}/revoke`, { method: 'POST' }).catch(() => null)),
    );
  } catch {
    return null;
  }
  // Any cached introspection for this user is now wrong.
  cache.clear();
  return null;
}

/**
 * Turns a Clerk password rejection into something a child can act on.
 *
 * The instance enforces the haveibeenpwned breach list, so an obvious choice
 * like "password123" is refused. Clerk's long_message is written for end users
 * and is better than anything generic, but the breach case gets its own wording
 * because "found in a data breach" means nothing to a nine-year-old.
 */
function passwordMessage(err) {
  const first = (err.clerk || [])[0] || {};
  if ((first.code || '').includes('pwned')) {
    return 'That password is too easy to guess - lots of people use it. Please pick another.';
  }
  return first.long_message || first.message || 'That password was not accepted.';
}

/**
 * Sets a new password and drops every other session, so a student changing
 * their temporary password on a shared device does not leave one open.
 *
 * Password checks are deliberately NOT skipped here. They are skipped when an
 * admin sets a temporary password, because the tutor is choosing it in front of
 * the child and it is replaced on first sign-in; the password the student keeps
 * is the one that should have to pass the instance policy.
 */
export async function setPassword(id, password) {
  try {
    await call(`/users/${id}`, {
      method: 'PATCH',
      body: { password, sign_out_of_other_sessions: true },
    });
  } catch (err) {
    if (err.status === 422) throw Object.assign(new Error(passwordMessage(err)), { status: 400 });
    throw err;
  }
  cache.clear();
}

/**
 * Clerk is a redirect provider: the browser signs in on Clerk's own pages and
 * comes back with a token, so /api/config only has to say where to send it.
 */
export { redirectConfig as config } from '../oidc.mjs';
