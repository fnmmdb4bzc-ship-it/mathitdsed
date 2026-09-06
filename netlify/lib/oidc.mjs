/**
 * OIDC discovery, for the providers that are OIDC providers.
 *
 * Netlify Identity is not one - it is GoTrue, which has no
 * /.well-known/openid-configuration and no authorization endpoint to send a
 * browser to. So this moved out of auth.mjs, where it used to run for every
 * provider and threw at import time if OIDC_ISSUER was unset. Now only
 * clerk.mjs and keycloak.mjs reach for it, and only when /api/config is called.
 */
let discoveryPromise = null;

export function issuer() {
  const value = process.env.OIDC_ISSUER;
  if (!value) throw new Error('OIDC_ISSUER is not set');
  return value.replace(/\/$/, '');
}

/** Memoised per warm function instance. Failures are not cached. */
export function discover() {
  discoveryPromise ??= fetch(`${issuer()}/.well-known/openid-configuration`)
    .then(res => {
      if (!res.ok) throw new Error(`OIDC discovery failed: ${res.status}`);
      return res.json();
    })
    .catch(err => { discoveryPromise = null; throw err; });
  return discoveryPromise;
}

/**
 * The /api/config payload for a redirect-based provider: the endpoints the
 * browser needs, resolved from discovery so no provider URL shapes are baked
 * into the frontend.
 */
export async function redirectConfig() {
  const d = await discover();
  return {
    mode: 'redirect',
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
