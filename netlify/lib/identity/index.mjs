/**
 * The identity provider, behind one small interface.
 *
 * This is the only genuinely provider-shaped code in the app. Everything else -
 * the schema, every route, the frontend - is generic, so changing provider is a
 * change to this directory plus environment variables.
 *
 * Two capabilities here are not interchangeable across providers, and both
 * were discovered by reading Clerk's API rather than assumed:
 *
 *   verifyToken  Keycloak issues JWTs, verified locally against a JWKS with no
 *                network call. Clerk's OIDC access tokens are opaque handles,
 *                so they must be introspected. Same signature, very different
 *                cost and failure modes.
 *
 *   setPassword  Clerk has no equivalent of Keycloak's temporary-password
 *                requiredAction, so the "must change on first sign-in" rule is
 *                enforced by this app instead (students.must_change_password),
 *                and the actual change is written through this function.
 *
 * Not here: reading live sessions to decide who is online. That was a
 * Keycloak-specific capability; "online" now means last_seen_at within a few
 * minutes, which every provider supports because we compute it ourselves.
 */
const PROVIDER = process.env.IDENTITY_PROVIDER || 'clerk';

const impl = PROVIDER === 'keycloak'
  ? await import('./keycloak.mjs')
  : await import('./clerk.mjs');

/** verifyToken(bearer) -> { sub, username, email, name, roles }. Throws HttpError(401). */
export const verifyToken    = impl.verifyToken;
/** createUser({username, email, firstName, password}) -> provider user id */
export const createUser     = impl.createUser;
/** Removes the login entirely. */
export const deleteUser     = impl.deleteUser;
/** Revokes or restores the ability to sign in, keeping the account. */
export const setUserEnabled = impl.setUserEnabled;
/** Ends every live session for a user. Best-effort: never throws. */
export const logoutUser     = impl.logoutUser;
/** Writes a new password and signs the user out everywhere else. */
export const setPassword    = impl.setPassword;
