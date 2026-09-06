/**
 * Netlify Identity, written against @netlify/identity v2.
 *
 * Four things about Identity shaped this file, and each one is a real
 * difference from Clerk rather than a rename:
 *
 * 1. Sessions are cookies, not bearer tokens. login() on the server sets
 *    nf_jwt through the Netlify runtime and getUser() reads it back, so there
 *    is no token for the browser to hold and none for us to introspect. That
 *    is why this adapter exports authenticate(req) instead of the
 *    verifyToken(bearer) the OIDC adapters use, and why it exports the
 *    sign-in/sign-up/sign-out half of the flow at all - with Clerk the browser
 *    is redirected away and none of that is ours.
 *
 * 2. Identity is email-and-password. GoTrue has no username field, so a child
 *    with no email address of their own - which the practice has plenty of -
 *    gets a synthetic address under IDENTITY_EMAIL_DOMAIN and signs in with
 *    the local part. The real username is kept in user_metadata.username and
 *    is what the app displays; email() below returns null for a synthetic
 *    address so nothing downstream mistakes it for somewhere mail can be sent.
 *
 * 3. There is no ban. Clerk has ban/unban; GoTrue's admin API can create,
 *    read, update and delete a user and nothing else. Disabling a student is
 *    therefore enforced by this application - students.status goes to
 *    'disabled' and requireActive() refuses every route - and setUserEnabled()
 *    only records the fact in app_metadata so it is visible in the Identity
 *    tab. A disabled student can still sign in; they land on "your account has
 *    been disabled" and can do nothing else.
 *
 * 4. There is no revoke-all-sessions either, so logoutUser() is a no-op. The
 *    ceiling on how long a disabled student keeps a working session is the
 *    access token's lifetime, after which the refresh fails against a user the
 *    API will not serve.
 */
import {
  admin, login, logout, signup, getUser, getSettings, refreshSession, verifyRequestOrigin,
  confirmEmail, requestPasswordRecovery, recoverPassword,
} from '@netlify/identity';
import { HttpError } from '../http.mjs';

/**
 * The domain synthetic addresses are minted under. `.invalid` is reserved by
 * RFC 2606 and can never resolve, which is the point: an admin-created student
 * is auto-confirmed and no mail is ever sent to it, and a typo cannot
 * accidentally reach a real inbox.
 */
const EMAIL_DOMAIN = process.env.IDENTITY_EMAIL_DOMAIN || 'students.mathit.invalid';

/** Tells the router that requests carry cookies, so mutations need an origin check. */
export const usesCookies = true;

const isSynthetic = address => String(address || '').toLowerCase().endsWith(`@${EMAIL_DOMAIN}`);

/** A bare username becomes username@EMAIL_DOMAIN; anything with an @ is taken as given. */
const addressFor = identifier => {
  const value = String(identifier || '').trim().toLowerCase();
  return value.includes('@') ? value : `${value}@${EMAIL_DOMAIN}`;
};

/**
 * Usernames have to survive being made into an email address.
 *
 * A tutor typing "Anna Smit" would otherwise produce "anna smit@..." and get
 * back GoTrue's own complaint about a malformed address, which says nothing
 * useful about what to type instead.
 */
const USERNAME = /^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/i;

const usernameOf = user =>
  user.userMetadata?.username
  || (user.email ? user.email.split('@')[0] : null)
  || user.id;

/**
 * Roles live in app_metadata.roles, which the library surfaces as user.roles.
 * The singular `role` field is accepted too, because that is what the Identity
 * tab in the Netlify UI writes.
 */
const rolesOf = user => {
  if (Array.isArray(user.roles) && user.roles.length) return user.roles;
  if (Array.isArray(user.appMetadata?.roles)) return user.appMetadata.roles;
  return user.role ? [user.role] : [];
};

const identityOf = user => ({
  sub: user.id,
  username: usernameOf(user),
  email: isSynthetic(user.email) ? null : (user.email || null),
  name: user.userMetadata?.full_name || user.name || usernameOf(user) || 'Student',
  roles: rolesOf(user),
});

/**
 * Turns the library's AuthError into our HttpError.
 *
 * GoTrue reports "that address is already registered" as a 422 or a 400
 * depending on the endpoint, so the message is what distinguishes it - the same
 * split the Clerk adapter makes on Clerk's error codes.
 */
function translate(err, fallback = 'identity request failed') {
  const message = err?.message || fallback;
  if (/already (been )?registered|already exists|duplicate/i.test(message)) {
    return new HttpError(409, 'username or email already exists');
  }
  return new HttpError(err?.status && err.status < 500 ? err.status : 502, message);
}

/**
 * Resolves the caller from the request's cookies.
 *
 * refreshSession() first: it swaps a nf_refresh cookie for a fresh access token
 * when the current one is within a minute of expiring, and updates both cookies
 * on the way out. Without it a student practising for longer than the token
 * lifetime would be signed out mid-session. It is best-effort - a network
 * failure here should fall through to getUser() and only 401 if that also comes
 * back empty.
 */
export async function authenticate() {
  try {
    await refreshSession();
  } catch {
    // Ignored on purpose: an unrefreshable session is simply an expired one.
  }

  const user = await getUser();
  if (!user) throw new HttpError(401, 'not signed in');
  return identityOf(user);
}

/** CSRF guard for cookie-authenticated mutations. Throws 403 on a foreign origin. */
export function verifyOrigin(req) {
  try {
    verifyRequestOrigin(req);
  } catch (err) {
    throw new HttpError(403, err?.message || 'cross-origin request refused');
  }
}

/**
 * What the frontend needs to render sign-in. `mode: 'password'` switches
 * mathit-auth.js from the redirect flow to its own form.
 *
 * disableSignup and autoconfirm are read from the project rather than assumed,
 * because both are settings a tutor can flip in the Netlify UI and both change
 * what the sign-up form should say.
 */
export async function config() {
  let settings = { disableSignup: false, autoconfirm: false };
  try {
    settings = await getSettings();
  } catch {
    // Identity not reachable: offer sign-in anyway and let it fail loudly.
  }
  return {
    mode: 'password',
    canSignUp: !settings.disableSignup,
    // With autoconfirm off, self-registration sends a confirmation email, so
    // the form has to insist on a real address it can be delivered to.
    requiresRealEmail: !settings.autoconfirm,
    emailDomain: EMAIL_DOMAIN,
  };
}

/** Signs in and sets the session cookies on the outgoing response. */
export async function signIn({ identifier, password }) {
  try {
    return identityOf(await login(addressFor(identifier), password));
  } catch (err) {
    throw new HttpError(401, 'that username or password is not right');
  }
}

/**
 * Self-registration. Requires a real address: the confirmation mail has to
 * arrive somewhere, and a synthetic one would bounce into a black hole. A
 * student with no email of their own is created by a tutor instead, which is
 * the admin path and does not go through here.
 */
export async function signUp({ identifier, password, name }) {
  const address = String(identifier || '').trim().toLowerCase();
  if (!address.includes('@') || isSynthetic(address)) {
    throw new HttpError(400, 'please use a real email address, or ask your teacher to make your account');
  }

  let user;
  try {
    user = await signup(address, password, {
      username: address.split('@')[0],
      full_name: name || address.split('@')[0],
    });
  } catch (err) {
    throw translate(err, 'could not create that account');
  }

  // Confirmed means autoconfirm was on and the cookies are already set;
  // otherwise the student has mail waiting and is not signed in yet.
  return { ...identityOf(user), signedIn: Boolean(user.confirmedAt) };
}

/** Clears the session cookies. Always succeeds from the browser's point of view. */
export async function signOut() {
  try {
    await logout();
  } catch {
    // logout() clears the cookies even when the Identity call fails.
  }
}

/**
 * Admin-created student. Auto-confirmed by admin.createUser, so no mail is
 * sent and the synthetic address never has to work.
 */
export async function createUser({ username, email, firstName, lastName, password }) {
  if (!email && !USERNAME.test(String(username || ''))) {
    throw new HttpError(400,
      'a username can only use letters, numbers, dots, dashes and underscores - no spaces');
  }
  const address = email ? String(email).trim().toLowerCase() : addressFor(username);
  try {
    const user = await admin.createUser({
      email: address,
      password,
      data: {
        user_metadata: {
          username,
          full_name: [firstName, lastName].filter(Boolean).join(' ') || username,
        },
      },
    });
    return user.id;
  } catch (err) {
    throw translate(err, 'could not create that account');
  }
}

export async function deleteUser(id) {
  try {
    await admin.deleteUser(id);
  } catch (err) {
    if (err?.status === 404) return null;   // already gone is fine
    throw translate(err, 'could not delete that account');
  }
  return null;
}

/**
 * Records the disabled state in app_metadata.
 *
 * Read-modify-write rather than a blind update: app_metadata also holds roles
 * and the provider, and writing a bare { disabled } object risks dropping them.
 * This does not stop the student signing in - see the note at the top - the
 * status column does.
 */
export async function setUserEnabled(id, enabled) {
  const user = await admin.getUser(id).catch(() => null);
  await admin.updateUser(id, {
    app_metadata: { ...(user?.appMetadata || {}), disabled: !enabled },
  });
}

/** No admin session revocation exists in GoTrue. Kept so the interface is whole. */
export async function logoutUser() {
  return null;
}

/**
 * Writes a new password.
 *
 * Unlike the Clerk version this cannot also drop the user's other sessions -
 * GoTrue has no call for it - so a student changing their password on a shared
 * device does not evict a session someone left open elsewhere. Signing out
 * still does, for the session doing the signing out.
 */
export async function setPassword(id, password) {
  try {
    await admin.updateUser(id, { password });
  } catch (err) {
    throw translate(err, 'that password was not accepted');
  }
}

/**
 * Redeems the token from a confirmation email and signs the student in.
 *
 * Self-registration is only half a flow without this. With autoconfirm off -
 * the default - signup() sends a mail whose link lands the browser back on the
 * site with #confirmation_token=..., and something has to spend it. Clerk hosted
 * that page; here it is ours, so mathit-auth.js reads the hash and posts it to
 * /api/auth/confirm.
 */
export async function confirmSignup({ token }) {
  try {
    return { ...identityOf(await confirmEmail(token)), signedIn: true };
  } catch (err) {
    throw new HttpError(400, 'that confirmation link has expired - please sign up again');
  }
}

/**
 * Starts a password reset.
 *
 * Deliberately silent about whether the address exists: this endpoint is
 * unauthenticated, so answering "no such account" would turn it into a way to
 * test whether a given child has one.
 */
export async function startRecovery({ identifier }) {
  const address = addressFor(identifier);
  if (isSynthetic(address)) {
    // A synthetic address has no inbox, so there is nothing to send. Say so
    // plainly rather than pretending mail is on its way.
    throw new HttpError(400, 'your account has no email address - ask your teacher to reset it for you');
  }
  try {
    await requestPasswordRecovery(address);
  } catch {
    // Swallowed for the same reason: failure and success must look identical.
  }
  return { sent: true };
}

/** Redeems a recovery token and sets the new password, signing the student in. */
export async function finishRecovery({ token, password }) {
  try {
    return { ...identityOf(await recoverPassword(token, password)), signedIn: true };
  } catch (err) {
    throw new HttpError(400, 'that reset link has expired - please ask for a new one');
  }
}
