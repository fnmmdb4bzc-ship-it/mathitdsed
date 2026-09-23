/**
 * The whole MathIT API, in one function.
 *
 * One function rather than one-per-route on purpose: a single cold start, a
 * single warm instance holding the cached settings and discovery document, and
 * one place where the auth pipeline is applied. Express is gone - the routing
 * here is eighteen routes and a path matcher, which is less code than the
 * adapter that would have been needed to run Express on a Request/Response
 * runtime.
 *
 * The /auth/* routes exist only for password providers (Netlify Identity).
 * With a redirect provider the browser signs in at the provider and these
 * answer 400, which is the honest thing for them to say - see
 * netlify/lib/identity/index.mjs.
 */
import { authenticate, loadStudent, requireRole, HttpError } from '../lib/auth.mjs';
import { query } from '../lib/db.mjs';
import * as identity from '../lib/identity/index.mjs';
import * as me from '../lib/routes/me.mjs';
import * as admin from '../lib/routes/admin.mjs';

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

/**
 * Normalises the request path to the /api/... form the routes are declared in.
 *
 * The netlify.toml rewrite can present this function with either the original
 * /api/me or the rewritten /.netlify/functions/api/me depending on how the
 * request arrived (a proxied request in `netlify dev` differs from a deployed
 * edge rewrite). Stripping both prefixes makes the router indifferent to which.
 */
function routePath(url) {
  return new URL(url).pathname
    .replace(/^\/\.netlify\/functions\/api/, '')
    .replace(/^\/api/, '')
    || '/';
}

// [method, pattern, handler, guard]
//   guard 'public'  - no session needed
//   guard 'student' - session required, students row loaded
//   guard 'admin'   - session required, 'admin' role required
const ROUTES = [
  ['GET',    '/health',                      health,                 'public'],
  ['GET',    '/config',                      config,                 'public'],

  ['POST',   '/auth/login',                  authLogin,              'public'],
  ['POST',   '/auth/signup',                 authSignup,             'public'],
  ['POST',   '/auth/logout',                 authLogout,             'public'],
  ['POST',   '/auth/confirm',                authConfirm,            'public'],
  ['POST',   '/auth/recover',                authRecover,            'public'],
  ['POST',   '/auth/reset',                  authReset,              'public'],

  ['GET',    '/me',                          me.getMe,               'student'],
  ['PUT',    '/me',                          me.putMe,               'student'],
  ['GET',    '/me/progress',                 me.getProgress,         'student'],
  ['POST',   '/me/practice',                 me.postPractice,        'student'],
  ['POST',   '/me/password',                 me.postPassword,        'student'],
  ['GET',    '/me/tasks',                    me.getTasks,            'student'],

  ['GET',    '/admin/students',              admin.listStudents,     'admin'],
  ['POST',   '/admin/students',              admin.createStudent,    'admin'],
  ['POST',   '/admin/students/:id/approve',  admin.approveStudent,   'admin'],
  ['POST',   '/admin/students/:id/disable',  admin.disableStudent,   'admin'],
  ['DELETE', '/admin/students/:id',          admin.deleteStudent,    'admin'],
  ['GET',    '/admin/students/:id/progress', admin.studentProgress,  'admin'],
  ['GET',    '/admin/students/:id/tasks',    admin.listTasks,        'admin'],
  ['POST',   '/admin/students/:id/tasks',    admin.createTask,       'admin'],
  ['POST',   '/admin/tasks/:taskId/complete', admin.completeTask,    'admin'],
  ['DELETE', '/admin/tasks/:taskId',         admin.deleteTask,       'admin'],
];

function match(method, path) {
  const parts = path.split('/').filter(Boolean);
  for (const [m, pattern, handler, guard] of ROUTES) {
    if (m !== method) continue;
    const want = pattern.split('/').filter(Boolean);
    if (want.length !== parts.length) continue;

    const params = {};
    if (want.every((seg, i) => seg.startsWith(':') ? (params[seg.slice(1)] = parts[i], true)
                                                   : seg === parts[i])) {
      return { handler, guard, params };
    }
  }
  return null;
}

/**
 * Reachability *and* schema, because they fail separately.
 *
 * A fresh Netlify Database answers SELECT 1 the moment it is provisioned, which
 * made the old check report a healthy API while every real route was about to
 * fail on a missing table. Asking for the students table distinguishes "the
 * database is down" from "the migrations have not run".
 */
async function health() {
  let ready;
  try {
    const { rows } = await query("SELECT to_regclass('public.students') IS NOT NULL AS ready");
    ready = Boolean(rows[0]?.ready);
  } catch (err) {
    // 503, not 500: the function is fine, its dependency is not. Matches the
    // old /api/health so any uptime check pointed at it keeps working.
    throw new HttpError(503, err.message, { body: { ok: false, error: err.message } });
  }

  if (!ready) {
    throw new HttpError(503, 'schema not applied', {
      body: { ok: false, database: 'reachable', schema: 'missing',
              error: 'the database is up but the migrations have not been applied' },
    });
  }
  return { ok: true, database: 'reachable', schema: 'applied' };
}

/**
 * Tells the frontend how sign-in works here.
 *
 * The payload is the adapter's, not this file's, because the two provider
 * families need to say different things: a redirect provider hands over
 * authorization and token endpoints, Netlify Identity hands over a mode and
 * whether self-registration is open. mathit-auth.js switches on `mode`.
 */
function config() {
  return identity.config();
}

/** Signs in against a password provider and sets the session cookie. */
async function authLogin({ body }) {
  const { identifier, password } = body ?? {};
  if (!identifier || !password) throw new HttpError(400, 'username and password are required');
  return { ...(await identity.signIn({ identifier, password })), signedIn: true };
}

async function authSignup({ body }) {
  const { identifier, password, name } = body ?? {};
  if (!identifier || !password) throw new HttpError(400, 'email and password are required');
  if (String(password).length < 8) throw new HttpError(400, 'password must be at least 8 characters');
  return identity.signUp({ identifier, password, name });
}

async function authLogout() {
  await identity.signOut();
  return { signedIn: false };
}

/** Spends the token from a confirmation email. Sent here by mathit-auth.js. */
async function authConfirm({ body }) {
  const { token } = body ?? {};
  if (!token) throw new HttpError(400, 'confirmation token is required');
  return identity.confirmSignup({ token });
}

/** Asks for a reset mail. Answers the same way whether or not the account exists. */
async function authRecover({ body }) {
  const { identifier } = body ?? {};
  if (!identifier) throw new HttpError(400, 'username or email is required');
  return identity.startRecovery({ identifier });
}

async function authReset({ body }) {
  const { token, password } = body ?? {};
  if (!token) throw new HttpError(400, 'reset token is required');
  if (String(password || '').length < 8) {
    throw new HttpError(400, 'password must be at least 8 characters');
  }
  return identity.finishRecovery({ token, password });
}

export default async function handler(req) {
  const route = match(req.method, routePath(req.url));
  if (!route) return json({ error: `no route for ${req.method} ${routePath(req.url)}` }, 404);

  try {
    /**
     * CSRF, and only for cookie sessions.
     *
     * A bearer token has to be attached deliberately by our own script, so a
     * cross-site form post carries no credentials. A cookie is attached by the
     * browser whether we like it or not, so every state-changing route needs
     * the origin checked. GET routes are exempt because they change nothing.
     */
    if (identity.usesCookies && req.method !== 'GET') identity.verifyOrigin(req);

    const ctx = { req, params: route.params };

    if (route.guard !== 'public') {
      ctx.auth = await authenticate(req);
      if (route.guard === 'admin') requireRole(ctx.auth, 'admin');
      else ctx.student = await loadStudent(ctx.auth);
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      ctx.body = await req.json().catch(() => ({}));
    }

    const result = await route.handler(ctx);
    // Handlers return a plain value, or {status, body} when they need a code.
    return result?.status && result?.body
      ? json(result.body, result.status)
      : json(result);
  } catch (err) {
    if (err instanceof HttpError) {
      return json(err.body ?? { error: err.message, ...(err.detail && { detail: err.detail }) },
                  err.status);
    }
    console.error('unhandled:', err);
    return json({ error: err.message || 'internal error' }, err.status || 500);
  }
}
