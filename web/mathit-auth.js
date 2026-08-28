/**
 * MathIT auth + API client.
 *
 * OIDC Authorization Code flow with PKCE, spoken directly to Keycloak. Written
 * by hand rather than pulling in keycloak-js so the app keeps its "no external
 * runtime dependencies" property.
 *
 * Tokens live in sessionStorage, not localStorage. That is deliberate: session
 * storage is scoped per tab, so two students on one device do not share a
 * login, and closing the tab ends the session. It is the browser half of the
 * isolation guarantee; the server half is that every /api/me route derives the
 * student from the token's `sub`, never from anything the client sends.
 */
(function (global) {
  'use strict';

  const STORE = {
    access: 'mathit_access_token',
    refresh: 'mathit_refresh_token',
    idToken: 'mathit_id_token',
    expires: 'mathit_expires_at',
    verifier: 'mathit_pkce_verifier',
    state: 'mathit_oidc_state',
    target: 'mathit_post_login_target',
  };

  let config = null;      // { issuer, realm, clientId }
  let profile = null;     // row from /api/me

  const ss = {
    get: k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} },
    del: k => { try { sessionStorage.removeItem(k); } catch (e) {} },
  };

  const b64url = bytes =>
    btoa(String.fromCharCode(...new Uint8Array(bytes)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const randomString = (len = 64) => {
    const a = new Uint8Array(len);
    crypto.getRandomValues(a);
    return Array.from(a, b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('').slice(0, len);
  };

  async function challengeFor(verifier) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
    return b64url(digest);
  }

  const endpoint = path => `${config.issuer}/protocol/openid-connect/${path}`;
  const redirectUri = () => window.location.origin + window.location.pathname;

  async function loadConfig() {
    if (config) return config;
    const res = await fetch('/api/config');
    if (!res.ok) throw new Error('cannot reach the MathIT API');
    config = await res.json();
    return config;
  }

  /** Sends the browser to Keycloak. `register: true` opens the sign-up form. */
  async function login({ register = false } = {}) {
    await loadConfig();
    const verifier = randomString(64);
    const state = randomString(32);
    ss.set(STORE.verifier, verifier);
    ss.set(STORE.state, state);
    ss.set(STORE.target, window.location.href);

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri(),
      response_type: 'code',
      scope: 'openid profile email',
      state,
      code_challenge: await challengeFor(verifier),
      code_challenge_method: 'S256',
    });
    window.location.assign(endpoint(register ? 'registrations' : 'auth') + '?' + params);
  }

  async function exchange(code) {
    const verifier = ss.get(STORE.verifier);
    const res = await fetch(endpoint('token'), {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: config.clientId,
        code,
        redirect_uri: redirectUri(),
        code_verifier: verifier || '',
      }),
    });
    if (!res.ok) throw new Error('token exchange failed: ' + (await res.text()));
    storeTokens(await res.json());
    ss.del(STORE.verifier);
    ss.del(STORE.state);
  }

  function storeTokens(t) {
    ss.set(STORE.access, t.access_token);
    if (t.refresh_token) ss.set(STORE.refresh, t.refresh_token);
    // Kept solely to pass as id_token_hint at logout - see logout() for why.
    if (t.id_token) ss.set(STORE.idToken, t.id_token);
    ss.set(STORE.expires, String(Date.now() + (t.expires_in || 300) * 1000));
  }

  async function refresh() {
    const rt = ss.get(STORE.refresh);
    if (!rt) return false;
    try {
      const res = await fetch(endpoint('token'), {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: config.clientId,
          refresh_token: rt,
        }),
      });
      if (!res.ok) return false;
      storeTokens(await res.json());
      return true;
    } catch (e) { return false; }
  }

  async function accessToken() {
    const exp = Number(ss.get(STORE.expires) || 0);
    if (ss.get(STORE.access) && Date.now() < exp - 30_000) return ss.get(STORE.access);
    if (await refresh()) return ss.get(STORE.access);
    return null;
  }

  function clearSession() {
    Object.values(STORE).forEach(ss.del);
    profile = null;
  }

  /**
   * RP-initiated logout.
   *
   * id_token_hint matters here: without it Keycloak cannot tell which session
   * to end, so it shows a "do you want to log out?" confirmation page and, if
   * nobody clicks it, leaves the SSO session alive. The next sign-in would then
   * silently resume as the previous student - exactly the leak this app is
   * meant to prevent on a shared device. With the hint, logout is immediate.
   */
  async function logout() {
    await loadConfig();
    const idToken = ss.get(STORE.idToken);
    const params = new URLSearchParams({
      post_logout_redirect_uri: window.location.origin + window.location.pathname,
    });
    if (idToken) params.set('id_token_hint', idToken);
    else params.set('client_id', config.clientId);

    clearSession();
    window.location.assign(endpoint('logout') + '?' + params);
  }

  /** Authenticated fetch against our own API. Throws {status, body} on failure. */
  async function api(path, options = {}) {
    const token = await accessToken();
    if (!token) throw Object.assign(new Error('not signed in'), { status: 401 });

    const res = await fetch(path.startsWith('/api') ? path : '/api' + path, {
      ...options,
      headers: {
        authorization: `Bearer ${token}`,
        ...(options.body ? { 'content-type': 'application/json' } : {}),
        ...(options.headers || {}),
      },
      body: options.body && typeof options.body !== 'string'
        ? JSON.stringify(options.body) : options.body,
    });

    const body = await res.json().catch(() => null);
    if (!res.ok) throw Object.assign(new Error(body?.error || res.statusText), { status: res.status, body });
    return body;
  }

  /**
   * Call once on page load. Completes a redirect if we just came back from
   * Keycloak, then resolves to the student profile or null if not signed in.
   */
  async function init() {
    await loadConfig();

    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      clearSession();
      history.replaceState({}, '', redirectUri());
      throw new Error(url.searchParams.get('error_description') || error);
    }

    if (code) {
      if (state && ss.get(STORE.state) && state !== ss.get(STORE.state)) {
        clearSession();
        throw new Error('OIDC state mismatch - possible tampering, please sign in again');
      }
      await exchange(code);
      history.replaceState({}, '', redirectUri()); // strip ?code= from the bar
    }

    if (!(await accessToken())) return null;

    try {
      profile = await api('/me');
      return profile;
    } catch (err) {
      if (err.status === 401) { clearSession(); return null; }
      throw err;
    }
  }

  global.MathITAuth = {
    init, login, logout, api,
    register: () => login({ register: true }),
    getProfile: () => profile,
    isSignedIn: () => Boolean(ss.get(STORE.access)),
    isAdmin: () => Boolean(profile?.roles?.includes('admin')),
    updateProfile: async patch => (profile = await api('/me', { method: 'PUT', body: patch })),
    recordPractice: payload => api('/me/practice', { method: 'POST', body: payload }),
    progress: () => api('/me/progress'),
  };
})(window);
