/**
 * Keycloak implementation, carried over from backend/src/keycloak-admin.js.
 *
 * Still useful even on Netlify: it is exactly option C from the discussion -
 * host Keycloak on a small container platform, run everything else here. It
 * also means this draft is runnable against the existing docker-compose
 * Keycloak via `netlify dev`, so the port can be tested before an identity
 * provider is chosen.
 *
 * The compose-era KEYCLOAK_INTERNAL_URL is gone. There is no private network
 * from a function, so there is one address: KEYCLOAK_URL.
 */
const BASE          = (process.env.KEYCLOAK_URL || '').replace(/\/$/, '');
const REALM         = process.env.KEYCLOAK_REALM || 'mathit';
const CLIENT_ID     = process.env.KEYCLOAK_API_CLIENT_ID || 'mathit-api';
const CLIENT_SECRET = process.env.KEYCLOAK_API_CLIENT_SECRET;

const admin = path => `${BASE}/admin/realms/${REALM}${path}`;

// Cached per warm instance only. A cold start pays one extra token request.
let cached = { token: null, expiresAt: 0 };

async function token() {
  if (cached.token && Date.now() < cached.expiresAt - 10_000) return cached.token;

  const res = await fetch(`${BASE}/realms/${REALM}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });
  if (!res.ok) throw new Error(`keycloak service-account login failed: ${res.status} ${await res.text()}`);

  const json = await res.json();
  cached = { token: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return cached.token;
}

async function call(path, options = {}) {
  const res = await fetch(admin(path), {
    ...options,
    headers: {
      authorization: `Bearer ${await token()}`,
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    throw new Error(`keycloak ${options.method || 'GET'} ${path} -> ${res.status} ${await res.text()}`);
  }
  return res.status === 204 || res.headers.get('content-length') === '0'
    ? null
    : res.json().catch(() => null);
}

export async function createUser({ username, email, firstName, lastName, password }) {
  const res = await fetch(admin('/users'), {
    method: 'POST',
    headers: { authorization: `Bearer ${await token()}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      username,
      email: email || undefined,
      firstName: firstName || username,
      // VERIFY_PROFILE blocks login outright when a name field is blank.
      lastName: lastName || 'Student',
      enabled: true,
      emailVerified: true,
      // Explicit: the only thing between an admin-created student and their
      // first lesson should be changing the temporary password.
      requiredActions: ['UPDATE_PASSWORD'],
      credentials: [{ type: 'password', value: password, temporary: true }],
    }),
  });

  if (res.status === 409) throw Object.assign(new Error('username or email already exists'), { status: 409 });
  if (!res.ok) throw new Error(`keycloak create user -> ${res.status} ${await res.text()}`);

  const id = (res.headers.get('location') || '').split('/').pop();
  if (!id) throw new Error('keycloak did not return a user id');
  return id;
}

export const deleteUser = id => call(`/users/${id}`, { method: 'DELETE' });

export const setUserEnabled = (id, enabled) =>
  call(`/users/${id}`, { method: 'PUT', body: JSON.stringify({ enabled }) });

export const logoutUser = id => call(`/users/${id}/logout`, { method: 'POST' }).catch(() => null);
