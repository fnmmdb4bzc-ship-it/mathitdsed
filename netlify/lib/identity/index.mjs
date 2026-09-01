/**
 * The identity provider's management API, behind four functions.
 *
 * This is the only genuinely provider-shaped code in the port. Everything else
 * - token verification, the schema, every route - is generic. Isolating it
 * here means choosing a provider is a decision about one directory.
 *
 * Note what is *not* here: onlineUserIds(). Reading live sessions was a
 * Keycloak-specific capability with no portable equivalent, and the app already
 * stamps students.last_seen_at on every authenticated request, so "online" is
 * now derived from that (see routes/admin.mjs). That deletes the view-clients
 * service-account trap documented in the README along with it.
 */
const PROVIDER = process.env.IDENTITY_PROVIDER || 'keycloak';

const impl = PROVIDER === 'clerk'
  ? await import('./clerk.mjs')
  : await import('./keycloak.mjs');

/** createUser({username, email, firstName, password}) -> provider user id */
export const createUser     = impl.createUser;
/** Removes the login entirely. */
export const deleteUser     = impl.deleteUser;
/** Revokes or restores the ability to sign in, keeping the account. */
export const setUserEnabled = impl.setUserEnabled;
/** Ends every live session for a user. Best-effort: never throws. */
export const logoutUser     = impl.logoutUser;
