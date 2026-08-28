/**
 * Thin wrapper over the Keycloak Admin REST API, authenticated as the
 * mathit-api service account.
 *
 * Keycloak stays the source of truth for identity, so deleting or disabling a
 * student has to happen here as well as in our own database - otherwise the
 * credentials would keep working.
 */

const INTERNAL = process.env.KEYCLOAK_INTERNAL_URL;
const REALM = process.env.KEYCLOAK_REALM || 'mathit';
const CLIENT_ID = process.env.KEYCLOAK_API_CLIENT_ID || 'mathit-api';
const CLIENT_SECRET = process.env.KEYCLOAK_API_CLIENT_SECRET;
const WEB_CLIENT_ID = 'mathit-web';

const admin = path => `${INTERNAL}/admin/realms/${REALM}${path}`;

let cached = { token: null, expiresAt: 0 };

async function token() {
  if (cached.token && Date.now() < cached.expiresAt - 10_000) return cached.token;

  const res = await fetch(`${INTERNAL}/realms/${REALM}/protocol/openid-connect/token`, {
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

/** Creates a student in Keycloak with a temporary password. Returns the new id. */
export async function createUser({ username, email, firstName, lastName, password }) {
  const res = await fetch(admin('/users'), {
    method: 'POST',
    headers: { authorization: `Bearer ${await token()}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      username,
      email: email || undefined,
      firstName: firstName || username,
      // Keycloak's VERIFY_PROFILE action blocks login outright when a name
      // field is blank, so give lastName a value rather than leaving it unset.
      lastName: lastName || 'Student',
      enabled: true,
      emailVerified: true,
      // Set explicitly: the only thing we want standing between an
      // admin-created student and their first lesson is changing the temporary
      // password. Left unset, Keycloak would add VERIFY_PROFILE as well.
      requiredActions: ['UPDATE_PASSWORD'],
      credentials: [{ type: 'password', value: password, temporary: true }],
    }),
  });

  if (res.status === 409) throw Object.assign(new Error('username or email already exists'), { status: 409 });
  if (!res.ok) throw new Error(`keycloak create user -> ${res.status} ${await res.text()}`);

  // Keycloak returns the new id only in the Location header.
  const id = (res.headers.get('location') || '').split('/').pop();
  if (!id) throw new Error('keycloak did not return a user id');
  return id;
}

export const deleteUser = id => call(`/users/${id}`, { method: 'DELETE' });

export const setUserEnabled = (id, enabled) =>
  call(`/users/${id}`, { method: 'PUT', body: JSON.stringify({ enabled }) });

/** Logs a student out everywhere - used when disabling or deleting. */
export const logoutUser = id => call(`/users/${id}/logout`, { method: 'POST' }).catch(() => null);

/**
 * The set of Keycloak user ids with a live session on the web client.
 * This is what makes "active right now" different from "enabled".
 */
export async function onlineUserIds() {
  const clients = await call(`/clients?clientId=${encodeURIComponent(WEB_CLIENT_ID)}`);

  // Keycloak filters this list by permission rather than returning 403, so a
  // service account missing view-clients gets [] - indistinguishable from
  // "nobody is online" unless we treat it as the error it is. Throwing makes
  // the roster report sessionsAvailable:false and warn, instead of quietly
  // showing everyone as offline forever.
  if (!clients?.length) {
    throw new Error(
      `client '${WEB_CLIENT_ID}' not visible to the service account - ` +
      'check it has the realm-management view-clients role');
  }

  const ids = new Set();
  const pageSize = 100;
  for (let first = 0; ; first += pageSize) {
    const sessions = await call(`/clients/${clients[0].id}/user-sessions?first=${first}&max=${pageSize}`);
    if (!sessions?.length) break;
    for (const s of sessions) ids.add(s.userId);
    if (sessions.length < pageSize) break;
  }
  return ids;
}
