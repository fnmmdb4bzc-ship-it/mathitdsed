/**
 * The whole MathIT API, in one function.
 *
 * One function rather than one-per-route on purpose: a single cold start, a
 * single warm instance holding the cached JWKS and discovery document, and one
 * place where the auth pipeline is applied. Express is gone - the routing here
 * is twelve routes and a path matcher, which is less code than the adapter
 * that would have been needed to run Express on a Request/Response runtime.
 */
import { authenticate, loadStudent, requireRole, discover, HttpError } from '../lib/auth.mjs';
import { query } from '../lib/db.mjs';
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
//   guard 'public'  - no token needed
//   guard 'student' - token required, students row loaded
//   guard 'admin'   - token required, 'admin' role required
const ROUTES = [
  ['GET',    '/health',                      health,                 'public'],
  ['GET',    '/config',                      config,                 'public'],

  ['GET',    '/me',                          me.getMe,               'student'],
  ['PUT',    '/me',                          me.putMe,               'student'],
  ['GET',    '/me/progress',                 me.getProgress,         'student'],
  ['POST',   '/me/practice',                 me.postPractice,        'student'],
  ['POST',   '/me/password',                 me.postPassword,        'student'],

  ['GET',    '/admin/students',              admin.listStudents,     'admin'],
  ['POST',   '/admin/students',              admin.createStudent,    'admin'],
  ['POST',   '/admin/students/:id/approve',  admin.approveStudent,   'admin'],
  ['POST',   '/admin/students/:id/disable',  admin.disableStudent,   'admin'],
  ['DELETE', '/admin/students/:id',          admin.deleteStudent,    'admin'],
  ['GET',    '/admin/students/:id/progress', admin.studentProgress,  'admin'],
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

async function health() {
  try {
    await query('SELECT 1');
  } catch (err) {
    // 503, not 500: the function is fine, its dependency is not. Matches the
    // old /api/health so any uptime check pointed at it keeps working.
    throw new HttpError(503, err.message, { body: { ok: false, error: err.message } });
  }
  return { ok: true };
}

/**
 * Tells the frontend where to send the browser for sign-in.
 *
 * This used to hand over an issuer and let the client build Keycloak URL paths
 * itself. Now the function resolves them through OIDC discovery and passes the
 * finished endpoints, so mathit-auth.js contains no provider-specific URL
 * shapes at all - which is most of what makes swapping providers a config
 * change rather than a rewrite.
 */
async function config() {
  const d = await discover();
  return {
    clientId: process.env.OIDC_CLIENT_ID,
    endpoints: {
      authorization: d.authorization_endpoint,
      token:         d.token_endpoint,
      endSession:    d.end_session_endpoint || null,
      // Not part of the discovery spec. Keycloak exposes registration as a
      // sibling of the auth endpoint; other providers need it given explicitly.
      register:      process.env.OIDC_SIGNUP_URL
                     || (d.authorization_endpoint?.endsWith('/auth')
                          ? d.authorization_endpoint.replace(/\/auth$/, '/registrations')
                          : null),
    },
  };
}

export default async function handler(req) {
  const route = match(req.method, routePath(req.url));
  if (!route) return json({ error: `no route for ${req.method} ${routePath(req.url)}` }, 404);

  try {
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
