/**
 * MathIT auth + API client.
 *
 * OIDC Authorization Code flow with PKCE, written by hand rather than pulling
 * in a provider SDK so the app keeps its "no external runtime dependencies"
 * property.
 *
 * There is no provider-specific URL construction here any more: /api/config
 * resolves the authorization, token and logout endpoints through OIDC
 * discovery and hands them over ready to use. Changing identity provider is a
 * change to the function's environment, not to this file.
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

  let config = null;      // { clientId, endpoints: {authorization, token, endSession, register} }
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

  const redirectUri = () => window.location.origin + window.location.pathname;

  async function loadConfig() {
    if (config) return config;
    const res = await fetch('/api/config');
    if (!res.ok) throw new Error('cannot reach the MathIT API');
    config = await res.json();
    return config;
  }

  /** Sends the browser to the identity provider. `register: true` opens sign-up. */
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
    const target = register
      ? (config.endpoints.register || config.endpoints.authorization)
      : config.endpoints.authorization;
    window.location.assign(target + '?' + params);
  }

  async function exchange(code) {
    const verifier = ss.get(STORE.verifier);
    const res = await fetch(config.endpoints.token, {
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
      const res = await fetch(config.endpoints.token, {
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

    const endSession = config.endpoints.endSession;
    clearSession();
    // No end_session_endpoint (some providers omit it): clearing our own tokens
    // is all we can do, so land the student back on a signed-out page.
    window.location.assign(endSession
      ? endSession + '?' + params
      : window.location.origin + window.location.pathname);
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
   * First-sign-in password change.
   *
   * The identity provider has no forced-password-change flow (Keycloak's
   * UPDATE_PASSWORD required action has no Clerk equivalent), so the rule is
   * enforced by our own API: while students.must_change_password is set, every
   * practice route returns 403 and only POST /api/me/password is allowed.
   *
   * The screen lives here rather than in MathIT.html on purpose. This file is
   * already the boundary that owns sign-in UX, and putting it here keeps the
   * 756KB app file out of the diff entirely.
   */
  function requirePasswordChange() {
    return new Promise(resolve => {
      const host = document.createElement('div');
      host.setAttribute('style', [
        'position:fixed', 'inset:0', 'z-index:9999',
        'display:flex', 'align-items:center', 'justify-content:center',
        'background:rgba(20,20,30,.75)',
        'font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif',
      ].join(';'));

      host.innerHTML = [
        '<form style="background:#fff;border-radius:14px;padding:28px 30px;',
        'max-width:380px;width:calc(100% - 32px);box-shadow:0 12px 40px rgba(0,0,0,.3)">',
        '<h2 style="margin:0 0 6px;font-size:1.25rem">Choose your own password</h2>',
        '<p style="margin:0 0 18px;color:#555;font-size:.9rem;line-height:1.45">',
        'Your teacher set a temporary password for you. Pick a new one that only',
        ' you know, then you can start practising.</p>',
        '<input type="password" name="pw" autocomplete="new-password" required',
        ' placeholder="New password" style="width:100%;box-sizing:border-box;',
        'padding:10px 12px;margin-bottom:10px;border:1px solid #ccc;border-radius:8px;font-size:1rem">',
        '<input type="password" name="pw2" autocomplete="new-password" required',
        ' placeholder="Type it again" style="width:100%;box-sizing:border-box;',
        'padding:10px 12px;border:1px solid #ccc;border-radius:8px;font-size:1rem">',
        '<p data-err style="min-height:1.2em;margin:8px 0 0;color:#c0392b;font-size:.85rem"></p>',
        '<button type="submit" style="width:100%;margin-top:10px;padding:11px;border:0;',
        'border-radius:8px;background:#e5698c;color:#fff;font-size:1rem;cursor:pointer">Save password</button>',
        '</form>',
      ].join('');

      const form = host.querySelector('form');
      const err  = host.querySelector('[data-err]');
      const btn  = host.querySelector('button');

      form.addEventListener('submit', async e => {
        e.preventDefault();
        const pw = form.pw.value, pw2 = form.pw2.value;

        // Checked here for a fast, friendly message; the API enforces the same
        // minimum, so this is convenience and not the actual guarantee.
        if (pw.length < 8)  { err.textContent = 'Please use at least 8 characters.'; return; }
        if (pw !== pw2)     { err.textContent = 'The two passwords do not match.';   return; }

        btn.disabled = true;
        btn.textContent = 'Saving...';
        try {
          profile = await api('/me/password', { method: 'POST', body: { password: pw } });
          host.remove();
          resolve(profile);
        } catch (e2) {
          err.textContent = e2.body?.error || e2.message || 'Could not save that password.';
          btn.disabled = false;
          btn.textContent = 'Save password';
        }
      });

      document.body.appendChild(host);
      form.pw.focus();
    });
  }

  /**
   * Call once on page load. Completes a redirect if we just came back from
   * the provider, then resolves to the student profile or null if not signed in.
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
      // Blocks here until a new password is set. Resolves to the fresh profile,
      // so the app renders as normal afterwards and never sees the gated state.
      if (profile.mustChangePassword) profile = await requirePasswordChange();
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
    changePassword: password => api('/me/password', { method: 'POST', body: { password } }),
    progress: () => api('/me/progress'),
  };
})(window);
