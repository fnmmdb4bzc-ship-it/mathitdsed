import express from 'express';
import { migrate, query, waitForDb } from './db.js';
import { authenticate, loadStudent, requireRole } from './auth.js';
import { meRouter } from './routes/me.js';
import { adminRouter } from './routes/admin.js';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '64kb' }));

// nginx proxies /api same-origin in compose, so CORS only matters when hitting
// port 3000 directly during development.
const ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:9090';
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', ORIGIN);
  res.set('Access-Control-Allow-Headers', 'authorization, content-type');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/api/health', async (_req, res) => {
  try {
    await query('SELECT 1');
    res.json({ ok: true });
  } catch (err) {
    res.status(503).json({ ok: false, error: err.message });
  }
});

// Tells the frontend where to send the browser for sign-in.
//
// Hands over finished endpoint URLs rather than an issuer, so mathit-auth.js
// contains no provider-specific path construction. That keeps the one shared
// copy of that file working against both this stack and the Netlify function,
// which resolves the same fields through OIDC discovery.
app.get('/api/config', (_req, res) => {
  const oidc = `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect`;
  res.json({
    clientId: 'mathit-web',
    endpoints: {
      authorization: `${oidc}/auth`,
      token:         `${oidc}/token`,
      endSession:    `${oidc}/logout`,
      register:      `${oidc}/registrations`,
    },
  });
});

app.use('/api/me', authenticate, loadStudent, meRouter);
app.use('/api/admin', authenticate, requireRole('admin'), adminRouter);

app.use((req, res) => res.status(404).json({ error: `no route for ${req.method} ${req.path}` }));

app.use((err, _req, res, _next) => {
  console.error('unhandled:', err);
  res.status(err.status || 500).json({ error: err.message || 'internal error' });
});

const port = Number(process.env.PORT || 3000);

console.log('mathit-api starting');
await waitForDb();
console.log('  database reachable');
await migrate();
console.log('  migrations up to date');

app.listen(port, () => console.log(`  listening on :${port}`));
