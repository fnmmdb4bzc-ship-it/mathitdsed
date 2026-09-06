/**
 * The identity provider, behind one small interface.
 *
 * This is the only genuinely provider-shaped code in the app. Everything else -
 * the schema, every route, the frontend - is generic, so changing provider is a
 * change to this directory plus environment variables.
 *
 * The interface grew one axis when Netlify Identity was added, because the
 * providers are not all the same shape of thing:
 *
 *   redirect providers (Clerk, Keycloak) send the browser away to sign in and
 *   hand back a bearer token. The app never sees a password. authenticate()
 *   verifies that token; there is no signIn() because signing in is not ours.
 *
 *   password providers (Netlify Identity) have no hosted sign-in page and no
 *   bearer token. The app collects the password itself, posts it to
 *   /api/auth/login, and the session lives in a cookie. authenticate() reads
 *   that cookie; signIn/signUp/signOut exist and are wired to real routes.
 *
 * config() is what tells the frontend which of the two it is dealing with, so
 * mathit-auth.js branches on data rather than on a build-time flag.
 */
import { HttpError } from '../http.mjs';
import * as netlify from './netlify.mjs';
import * as clerk from './clerk.mjs';
import * as keycloak from './keycloak.mjs';

// Static imports, not `await import('./' + name)`: esbuild has to be able to
// see every module at bundle time or the function ships without them.
const IMPLS = { netlify, clerk, keycloak };

const PROVIDER = process.env.IDENTITY_PROVIDER || 'netlify';
const impl = IMPLS[PROVIDER];
if (!impl) {
  throw new Error(`IDENTITY_PROVIDER must be one of ${Object.keys(IMPLS).join(', ')}, got '${PROVIDER}'`);
}

/**
 * Bearer-token authentication, used by every provider that does not supply its
 * own authenticate(). Pulling the header apart is the same for all of them; the
 * part that differs is verifyToken(), which each adapter owns.
 */
const bearerAuthenticate = async req => {
  const header = req.headers.get('authorization') || '';
  if (!header.startsWith('Bearer ')) throw new HttpError(401, 'missing bearer token');
  return impl.verifyToken(header.slice(7));
};

const unsupported = name => async () => {
  throw new HttpError(400, `${PROVIDER} does not support ${name} - sign-in happens at the provider`);
};

/** True when the session is a cookie, which is what makes CSRF checks necessary. */
export const usesCookies = Boolean(impl.usesCookies);

/** authenticate(req) -> { sub, username, email, name, roles }. Throws HttpError(401). */
export const authenticate = impl.authenticate || bearerAuthenticate;
/** config() -> the /api/config payload, including which sign-in mode to render. */
export const config = impl.config;
/** verifyOrigin(req) - CSRF guard. Only meaningful for cookie sessions. */
export const verifyOrigin = impl.verifyOrigin || (() => {});

/** The session half of the interface. Password providers only. */
export const signIn  = impl.signIn  || unsupported('signIn');
export const signUp  = impl.signUp  || unsupported('signUp');
export const signOut = impl.signOut || unsupported('signOut');

/**
 * Email confirmation and password reset. A redirect provider hosts these pages
 * itself and never routes them through us, which is why they are stubbed rather
 * than implemented for Clerk and Keycloak.
 */
export const confirmSignup  = impl.confirmSignup  || unsupported('confirmSignup');
export const startRecovery  = impl.startRecovery  || unsupported('startRecovery');
export const finishRecovery = impl.finishRecovery || unsupported('finishRecovery');

/** createUser({username, email, firstName, password}) -> provider user id */
export const createUser     = impl.createUser;
/** Removes the login entirely. */
export const deleteUser     = impl.deleteUser;
/** Revokes or restores the ability to sign in, keeping the account. */
export const setUserEnabled = impl.setUserEnabled;
/** Ends every live session for a user. Best-effort: never throws. */
export const logoutUser     = impl.logoutUser;
/** Writes a new password. */
export const setPassword    = impl.setPassword;
