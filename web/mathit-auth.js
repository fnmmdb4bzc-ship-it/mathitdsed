/**
 * MathIT auth + API client.
 *
 * Handles both shapes of identity provider, because they are genuinely
 * different flows and /api/config says which one is live:
 *
 *   mode 'password'  (Netlify Identity) - there is no hosted sign-in page to
 *                    send anyone to, so the forms are here and the credentials
 *                    are posted to our own /api/auth/*. The session is the
 *                    nf_jwt cookie the function sets; this file never sees a
 *                    token and does not store one.
 *
 *   mode 'redirect'  (Clerk, Keycloak) - the browser goes to the provider and
 *                    comes back with a code, which is exchanged for a bearer
 *                    token held in sessionStorage. Authorization Code flow with
 *                    PKCE, written by hand so the app keeps its "no external
 *                    runtime dependencies" property.
 *
 * The exported surface is identical either way, which is what keeps MathIT.html
 * and admin.html out of this change entirely: they call login(), logout() and
 * api() and never learn which provider answered.
 *
 * On tokens and tabs: in redirect mode tokens live in sessionStorage, scoped per
 * tab, so two students on one device do not share a login. Netlify Identity's
 * cookie is not tab-scoped - it cannot be, the server sets it - so on a shared
 * device signing out matters more here than it did. It is the browser half of
 * the isolation guarantee; the server half is unchanged, and stronger: every
 * /api/me route derives the student from the session's subject, never from
 * anything the client sends.
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

  let config = null;      // { mode, ... } from /api/config
  let profile = null;     // row from /api/me
  let signedIn = false;   // password mode has no client-side token to check

  const ss = {
    get: k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} },
    del: k => { try { sessionStorage.removeItem(k); } catch (e) {} },
  };

  const isPasswordMode = () => config?.mode === 'password';
  const here = () => window.location.origin + window.location.pathname;

  async function loadConfig() {
    if (config) return config;
    const res = await fetch('/api/config');
    if (!res.ok) throw new Error('cannot reach the MathIT API');
    config = await res.json();
    return config;
  }

  /* ------------------------------------------------------------------ *
   * Requests
   * ------------------------------------------------------------------ */

  /** Unauthenticated POST to our own API, for the /api/auth/* routes. */
  async function post(path, body) {
    const res = await fetch(path, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body || {}),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw Object.assign(new Error(data?.error || res.statusText),
                          { status: res.status, body: data });
    }
    return data;
  }

  /** Authenticated fetch against our own API. Throws {status, body} on failure. */
  async function api(path, options = {}) {
    const headers = {
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...(options.headers || {}),
    };

    // Redirect mode carries the token itself; password mode rides the cookie,
    // which is why every request here is same-origin and credentialed.
    if (!isPasswordMode()) {
      const token = await accessToken();
      if (!token) throw Object.assign(new Error('not signed in'), { status: 401 });
      headers.authorization = 'Bearer ' + token;
    }

    const res = await fetch(path.startsWith('/api') ? path : '/api' + path, {
      credentials: 'same-origin',
      ...options,
      headers,
      body: options.body && typeof options.body !== 'string'
        ? JSON.stringify(options.body) : options.body,
    });

    const body = await res.json().catch(() => null);
    if (!res.ok) throw Object.assign(new Error(body?.error || res.statusText), { status: res.status, body });
    return body;
  }

  /* ------------------------------------------------------------------ *
   * Forms (password mode)
   * ------------------------------------------------------------------ */

  const CARD = 'background:#fff;border-radius:14px;padding:28px 30px;max-width:380px;'
             + 'width:calc(100% - 32px);box-shadow:0 12px 40px rgba(0,0,0,.3)';
  const INPUT = 'width:100%;box-sizing:border-box;padding:10px 12px;margin-bottom:10px;'
              + 'border:1px solid #ccc;border-radius:8px;font-size:1rem';
  const BUTTON = 'width:100%;margin-top:10px;padding:11px;border:0;border-radius:8px;'
               + 'background:#e5698c;color:#fff;font-size:1rem;cursor:pointer';
  const LINK = 'background:none;border:0;padding:0;margin-top:12px;color:#7a5;'
             + 'font-size:.85rem;cursor:pointer;text-decoration:underline';

  const escapeHtml = s => String(s).replace(/[&<>"]/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /**
   * One dialog, used for sign-in, sign-up, the forced password change and the
   * reset form. It resolves with whatever onSubmit returns, or null if the
   * student dismissed it - which the forced password change forbids by passing
   * dismissible: false, because there is nothing else it can let them do.
   */
  function modal({ title, intro, fields, submit, links = [], dismissible = true, onSubmit }) {
    return new Promise(resolve => {
      const host = document.createElement('div');
      host.setAttribute('style', [
        'position:fixed', 'inset:0', 'z-index:9999',
        'display:flex', 'align-items:center', 'justify-content:center',
        'background:rgba(20,20,30,.75)',
        'font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif',
      ].join(';'));

      host.innerHTML =
        '<form style="' + CARD + '">'
        + '<h2 style="margin:0 0 6px;font-size:1.25rem">' + escapeHtml(title) + '</h2>'
        + (intro ? '<p style="margin:0 0 18px;color:#555;font-size:.9rem;line-height:1.45">'
                   + escapeHtml(intro) + '</p>' : '<div style="height:12px"></div>')
        + fields.map(f =>
            '<input name="' + f.name + '" type="' + (f.type || 'text') + '"'
            + ' placeholder="' + escapeHtml(f.placeholder) + '"'
            + ' autocomplete="' + (f.autocomplete || 'off') + '"'
            + (f.required === false ? '' : ' required')
            + ' style="' + INPUT + '">').join('')
        + '<p data-err style="min-height:1.2em;margin:8px 0 0;color:#c0392b;font-size:.85rem"></p>'
        + '<button type="submit" style="' + BUTTON + '">' + escapeHtml(submit) + '</button>'
        + links.map((l, i) =>
            '<div><button type="button" data-link="' + i + '" style="' + LINK + '">'
            + escapeHtml(l.label) + '</button></div>').join('')
        + '</form>';

      const form = host.querySelector('form');
      const err  = host.querySelector('[data-err]');
      const btn  = host.querySelector('button[type=submit]');
      const close = value => { host.remove(); document.removeEventListener('keydown', onKey); resolve(value); };

      function onKey(e) { if (dismissible && e.key === 'Escape') close(null); }

      links.forEach((l, i) => {
        host.querySelector('[data-link="' + i + '"]')
            .addEventListener('click', () => { close(null); l.onClick(); });
      });

      if (dismissible) {
        host.addEventListener('click', e => { if (e.target === host) close(null); });
        document.addEventListener('keydown', onKey);
      }

      form.addEventListener('submit', async e => {
        e.preventDefault();
        err.textContent = '';
        const values = {};
        fields.forEach(f => { values[f.name] = form[f.name].value; });

        btn.disabled = true;
        const label = btn.textContent;
        btn.textContent = 'Please wait...';
        try {
          close(await onSubmit(values));
        } catch (e2) {
          err.textContent = e2.message || 'Something went wrong. Please try again.';
          btn.disabled = false;
          btn.textContent = label;
        }
      });

      document.body.appendChild(host);
      form.querySelector('input')?.focus();
    });
  }

  /**
   * A local check before the round trip. The API enforces the same minimum, so
   * this is a faster, friendlier message and not the actual guarantee.
   */
  function checkPassword(pw, pw2) {
    if (pw.length < 8) throw new Error('Please use at least 8 characters.');
    if (pw2 !== undefined && pw !== pw2) throw new Error('The two passwords do not match.');
  }

  function signInForm() {
    const links = [{ label: 'Forgot your password?', onClick: () => recoverForm() }];
    if (config.canSignUp) links.push({ label: 'Create an account', onClick: () => signUpForm() });

    return modal({
      title: 'Sign in to MathIT',
      intro: 'Use the username your teacher gave you, or your email address.',
      fields: [
        { name: 'identifier', placeholder: 'Username or email', autocomplete: 'username' },
        { name: 'password', type: 'password', placeholder: 'Password', autocomplete: 'current-password' },
      ],
      submit: 'Sign in',
      links,
      onSubmit: async v => {
        await post('/api/auth/login', { identifier: v.identifier.trim(), password: v.password });
        // Reload rather than re-render: the app reads its signed-in state during
        // start-up, so this is the one path that is guaranteed to be consistent.
        window.location.assign(here());
        return true;
      },
    });
  }

  async function signUpForm() {
    const result = await modal({
      title: 'Create an account',
      intro: 'You will get an email to confirm it is really you. Your teacher then approves '
           + 'the account before you can start practising.',
      fields: [
        { name: 'name', placeholder: 'Your name', autocomplete: 'name' },
        { name: 'identifier', type: 'email', placeholder: 'Email address', autocomplete: 'email' },
        { name: 'password', type: 'password', placeholder: 'Choose a password', autocomplete: 'new-password' },
        { name: 'password2', type: 'password', placeholder: 'Type it again', autocomplete: 'new-password' },
      ],
      submit: 'Create account',
      links: [{ label: 'I already have an account', onClick: () => signInForm() }],
      onSubmit: async v => {
        checkPassword(v.password, v.password2);
        return post('/api/auth/signup', {
          identifier: v.identifier.trim(), password: v.password, name: v.name.trim(),
        });
      },
    });

    if (!result) return null;                                    // dismissed
    // Signed in already means the project has autoconfirm on and there is no
    // mail to wait for; otherwise the account exists but is not usable yet.
    if (result.signedIn) return window.location.assign(here());
    return notice('Check your email',
                  'We have sent you a link to confirm your address. Open it, and then your '
                  + 'teacher can approve your account.');
  }

  async function recoverForm() {
    const result = await modal({
      title: 'Reset your password',
      intro: 'We will email you a link to choose a new one.',
      fields: [{ name: 'identifier', placeholder: 'Username or email', autocomplete: 'username' }],
      submit: 'Send the link',
      links: [{ label: 'Back to sign in', onClick: () => signInForm() }],
      onSubmit: v => post('/api/auth/recover', { identifier: v.identifier.trim() }),
    });

    if (!result) return null;
    return notice('Check your email', 'If that account exists, a reset link is on its way to it.');
  }

  /** The form the reset link lands on. Not dismissible: the token is single use. */
  function resetForm(token) {
    return modal({
      title: 'Choose a new password',
      intro: 'Pick a new password that only you know.',
      fields: [
        { name: 'password', type: 'password', placeholder: 'New password', autocomplete: 'new-password' },
        { name: 'password2', type: 'password', placeholder: 'Type it again', autocomplete: 'new-password' },
      ],
      submit: 'Save password',
      dismissible: false,
      onSubmit: async v => {
        checkPassword(v.password, v.password2);
        await post('/api/auth/reset', { token, password: v.password });
        return true;
      },
    });
  }

  /** A dialog with nothing to fill in - used for "check your email". */
  function notice(title, intro) {
    return modal({ title, intro, fields: [], submit: 'OK', onSubmit: async () => true });
  }

  /* ------------------------------------------------------------------ *
   * Redirect mode: OIDC Authorization Code + PKCE
   * ------------------------------------------------------------------ */

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

  async function redirectLogin({ register = false } = {}) {
    const verifier = randomString(64);
    const state = randomString(32);
    ss.set(STORE.verifier, verifier);
    ss.set(STORE.state, state);
    ss.set(STORE.target, window.location.href);

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: here(),
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
        redirect_uri: here(),
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
    // Kept solely to pass as id_token_hint at logout - see redirectLogout().
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
    if (ss.get(STORE.access) && Date.now() < exp - 30000) return ss.get(STORE.access);
    if (await refresh()) return ss.get(STORE.access);
    return null;
  }

  function clearSession() {
    Object.values(STORE).forEach(ss.del);
    profile = null;
    signedIn = false;
  }

  /**
   * RP-initiated logout.
   *
   * id_token_hint matters here: without it Keycloak cannot tell which session to
   * end, so it shows a "do you want to log out?" confirmation page and, if
   * nobody clicks it, leaves the SSO session alive. The next sign-in would then
   * silently resume as the previous student - exactly the leak this app is meant
   * to prevent on a shared device. With the hint, logout is immediate.
   */
  function redirectLogout() {
    const idToken = ss.get(STORE.idToken);
    const params = new URLSearchParams({ post_logout_redirect_uri: here() });
    if (idToken) params.set('id_token_hint', idToken);
    else params.set('client_id', config.clientId);

    const endSession = config.endpoints.endSession;
    clearSession();
    // No end_session_endpoint (some providers omit it): clearing our own tokens
    // is all we can do, so land the student back on a signed-out page.
    window.location.assign(endSession ? endSession + '?' + params : here());
  }

  /* ------------------------------------------------------------------ *
   * Entry points
   * ------------------------------------------------------------------ */

  async function login(options) {
    await loadConfig();
    return isPasswordMode() ? signInForm() : redirectLogin(options);
  }

  async function register() {
    await loadConfig();
    if (!isPasswordMode()) return redirectLogin({ register: true });
    if (!config.canSignUp) {
      return notice('Ask your teacher',
                    'New accounts are made by the practice. Ask your teacher to set one up for you.');
    }
    return signUpForm();
  }

  async function logout() {
    await loadConfig();
    if (!isPasswordMode()) return redirectLogout();
    try {
      await post('/api/auth/logout');
    } catch (e) {
      // The cookie is cleared server-side even when the Identity call fails, and
      // there is nothing useful to tell a child about a failed sign-out anyway.
    }
    clearSession();
    window.location.assign(here());
  }

  /**
   * First-sign-in password change.
   *
   * No identity provider this app supports has a forced-password-change flow -
   * Keycloak's UPDATE_PASSWORD required action has no Clerk or Netlify Identity
   * equivalent - so the rule is enforced by our own API: while
   * students.must_change_password is set, every practice route returns 403 and
   * only POST /api/me/password is allowed.
   *
   * The screen lives here rather than in MathIT.html on purpose. This file is
   * already the boundary that owns sign-in UX, and putting it here keeps the
   * 756KB app file out of the diff entirely.
   */
  function requirePasswordChange() {
    return modal({
      title: 'Choose your own password',
      intro: 'Your teacher set a temporary password for you. Pick a new one that only you know, '
           + 'then you can start practising.',
      fields: [
        { name: 'pw', type: 'password', placeholder: 'New password', autocomplete: 'new-password' },
        { name: 'pw2', type: 'password', placeholder: 'Type it again', autocomplete: 'new-password' },
      ],
      submit: 'Save password',
      dismissible: false,
      onSubmit: async v => {
        checkPassword(v.pw, v.pw2);
        profile = await api('/me/password', { method: 'POST', body: { password: v.pw } });
        return profile;
      },
    });
  }

  /**
   * Netlify Identity's confirmation and reset mails land back on the site with
   * the token in the URL fragment. Nothing else will spend it, so this does,
   * before anything else runs.
   */
  async function handleIdentityHash() {
    const hash = new URLSearchParams(String(window.location.hash || '').replace(/^#/, ''));
    const confirmation = hash.get('confirmation_token');
    const recovery = hash.get('recovery_token');
    if (!confirmation && !recovery) return;

    // Cleared first: the token is single-use, and leaving it in the address bar
    // means a refresh retries it and shows a spurious "link has expired".
    history.replaceState({}, '', here());

    if (confirmation) {
      try {
        await post('/api/auth/confirm', { token: confirmation });
      } catch (e) {
        // An expired or already-spent link is a dead end, not a broken app: say
        // so and let start-up carry on to the signed-out screen.
        await notice('That link did not work', e.message);
      }
      return;
    }
    await resetForm(recovery);
  }

  /**
   * Call once on page load. Finishes whatever flow the browser came back from,
   * then resolves to the student profile, or null if nobody is signed in.
   */
  async function init() {
    await loadConfig();

    if (isPasswordMode()) {
      await handleIdentityHash();
    } else {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const error = url.searchParams.get('error');

      if (error) {
        clearSession();
        history.replaceState({}, '', here());
        throw new Error(url.searchParams.get('error_description') || error);
      }

      if (code) {
        if (state && ss.get(STORE.state) && state !== ss.get(STORE.state)) {
          clearSession();
          throw new Error('OIDC state mismatch - possible tampering, please sign in again');
        }
        await exchange(code);
        history.replaceState({}, '', here()); // strip ?code= from the bar
      }

      if (!(await accessToken())) return null;
    }

    try {
      profile = await api('/me');
      signedIn = true;
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
    init, login, logout, api, register,
    getProfile: () => profile,
    isSignedIn: () => (isPasswordMode() ? signedIn : Boolean(ss.get(STORE.access))),
    isAdmin: () => Boolean(profile?.roles?.includes('admin')),
    updateProfile: async patch => (profile = await api('/me', { method: 'PUT', body: patch })),
    recordPractice: payload => api('/me/practice', { method: 'POST', body: payload }),
    changePassword: password => api('/me/password', { method: 'POST', body: { password } }),
    progress: () => api('/me/progress'),
  };
})(window);
