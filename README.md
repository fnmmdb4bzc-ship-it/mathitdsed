# MathIT

A CAPS-aligned maths practice web app for Foundation Phase through Grade 6 (plus UK
National Curriculum Key Stage 3, Years 7–8), built for Debby Smit Educational Therapy.
Live at: https://mathitdset.netlify.app/

Fully bilingual (English / Afrikaans, chosen per student profile) for Foundation Phase
through Grade 6 and the Manipulatives tab. Levels 7–8 are English-only.

## What's in this repo

- **`MathIT.html`** — the deployed app. A single self-contained HTML/CSS/JS file (no
  build step, no external runtime dependencies beyond a Google Font stylesheet link).
  This is the file Netlify serves as `index.html`.
- **`assets/`** — source images and the handwriting font used by the app. Their content
  is embedded into `MathIT.html` as base64 `data:` URIs, so this folder is a reference
  copy of the originals, not something the page loads at runtime.
- **`build/`** — an earlier modular source split (`fp_body.js`, `g4_body.js`,
  `g5_body.js`, `g6_body.js`, `assemble.js`) used at one point to assemble the app from
  per-grade pieces. **This does not reflect the current file** — `MathIT.html` has since
  been hand-edited directly and extensively (bilingual support, bug fixes, content
  additions) without being regenerated from these sources. Kept for history only; do not
  assume running `assemble.js` reproduces today's `MathIT.html`.
- **`practice_app.html`**, **`practice_app_grade4.html`** — earlier standalone
  prototypes, superseded by `MathIT.html`. Kept for history.
- **`netlify/`** — the deployed backend: one function (`functions/api.mjs`), the
  identity adapters and routes it is built from (`lib/`), and the database schema
  (`database/migrations/`, applied by Netlify at deploy).
- **`backend/`** — the older Express version of the same API, still used by the
  docker-compose stack. It applies the same migration files at start-up.
- **`keycloak/realm-mathit.json`** — the Keycloak realm, imported on first
  start: roles, clients, self-registration settings, and a `tutor` admin user.
- **`web/`** — `admin.html` (the practice admin console), `mathit-auth.js`
  (OIDC/PKCE sign-in and API client), and the nginx config.
- **`serve.py`** — static dev server that serves `MathIT.html` at `/`. Only
  useful for the standalone, sign-in-free version of the app.

## Accounts and data

Since students now sign in individually, the app is no longer a single static
file. The rules below are the same whichever way it is running; the pieces that
implement them differ, and the deployed set is described under
[Running it on Netlify](#running-it-on-netlify).

| Owns | Deployed (Netlify) | Local (docker-compose) |
|---|---|---|
| identity: credentials, sessions, roles, self-registration | Netlify Identity | Keycloak |
| student records, approval state, streaks, per-topic scores | Netlify Database | Postgres |
| authorisation, progress recording, admin operations | one function | Express API |
| serving the app with `/api` same-origin | Netlify | nginx |

**Students self-register but stay inert until approved.** Registration happens
on Keycloak's own form. The first time a new account presents a token, the API
creates a `pending` student row, and every practice endpoint refuses to serve
it until an admin approves. The student sees an "Almost there!" screen.

**Isolation.** Every `/api/me` route derives the student from the access
token's `sub` claim, never from an id in the request, so one student cannot
read or write another's data by editing a request. In the browser, tokens live
in `sessionStorage` (per tab), and "Sign out" performs a full RP-initiated
Keycloak logout, so a shared device does not leak one child's session into the
next child's.

**Two deliberate Keycloak settings**, for the compose stack only (realm JSON
carries no comments, so they are recorded here):

- `VERIFY_PROFILE` is **disabled**. Keycloak's declarative user profile treats
  email as required, so a student an admin creates without one gets trapped on
  a "complete your profile" screen right after setting their password. Children
  in a therapy practice often have no email of their own. The `requiredActions`
  array lists every action explicitly, because a partial array on import
  *replaces* the defaults — which would switch off `UPDATE_PASSWORD` and break
  the temporary-password flow.
- The `mathit-api` service account needs **`view-clients`** as well as the user
  roles. Without it, Keycloak returns an empty client list rather than a 403,
  so the admin console would show every student as offline forever with no
  error anywhere.

**Admin.** Sign in as an admin and the header shows an *Admin* link, or go
straight to `/admin.html`. From there you can approve pending students, add
students directly (created at the identity provider with a temporary password),
disable or delete them, and see who is online. On Netlify "online" means
"made a request in the last five minutes"; on the compose stack it reads live
Keycloak sessions and means "signed in this moment".

Not included: the Word-document deliverables (`Grade6_Maths_Intervention_Plan.docx`,
`Practice_App_Manipulatives_Pack.docx`) and their generator scripts (`build.js`,
`build_manipulatives.js`). Those produce separate print deliverables, not this web app,
so they were left out of this repository.

## Running it on Netlify

A static site plus **one** function, with **Netlify Database** for storage and
**Netlify Identity** for sign-in. Both are reached through the Netlify runtime,
so the deployment has no secrets to configure — no API keys, no connection
string, nothing in the environment variables tab.

| Piece | Compose stack | Netlify |
|---|---|---|
| static files | nginx allow-list | `scripts/build-site.mjs` stages `dist/` |
| API | Express, 4 files | one function, hand-rolled router |
| Postgres | compose service | Netlify Database |
| migrations | at API start-up | applied by Netlify before each deploy publishes |
| identity | Keycloak | Netlify Identity (GoTrue) |
| session | bearer token in `sessionStorage` | `nf_jwt` cookie set by the function |
| "online now" | live Keycloak sessions | `last_seen_at` within 5 minutes |
| CORS | needed on :3000 | gone — `/api/*` is same-origin |

### Setting it up

1. **Enable Identity.** Project configuration → Identity → Enable. Under
   Registration, choose *Open* if students should be able to sign themselves up,
   or *Invite only* if every account is made by the tutor. The sign-up form in
   the app hides itself when registration is closed.
2. **Create the database.** `netlify database init`, or Data & Storage →
   Database in the UI. The schema in `netlify/database/migrations/` is applied
   automatically before the first deploy publishes; a failing migration fails the
   deploy rather than leaving a half-built database behind.
3. **Deploy.** `netlify deploy --prod`, or push the branch.
4. **Make yourself an admin.** Sign up through the app, then in Identity → your
   user, set the role `admin`. The API reads roles from `app_metadata.roles`,
   which is what the Identity tab writes.

```bash
npm install
npm run dev        # netlify dev - serves the site, the function and a local Postgres
```

### Five things that changed behaviour

These are not plumbing — they are visible differences from the Clerk and
Keycloak versions, and each one is a limit of GoTrue rather than a choice.

- **There are no usernames.** GoTrue identifies users by email address and has
  no username field. The practice has children with no email of their own, so a
  tutor-created student gets a synthetic address under
  `IDENTITY_EMAIL_DOMAIN` (default `students.mathit.invalid`, a domain that can
  never resolve) and signs in with just the local part — "anna" works as before.
  The real username is kept in `user_metadata` and is what the app displays.
  Self-registration is the exception: it needs a real address, because a
  confirmation mail has to arrive somewhere.
- **Disabling a student is enforced by this app, not by Identity.** GoTrue's
  admin API can create, read, update and delete a user and nothing else — there
  is no ban, the way Clerk has one. So "Disable" sets `students.status` and
  `requireActive()` refuses every route. A disabled student can still sign in;
  they land on "your account has been disabled" and can do nothing else. The
  same gap means there is no revoke-all-sessions, so a student disabled
  mid-session keeps a working token until it expires.
- **Sign-in is a form in the app, not a page at the provider.** Identity has no
  hosted sign-in page to redirect to, so `mathit-auth.js` collects the password
  and posts it to `/api/auth/login`, and the function calls Identity and sets the
  session cookie. The password never goes anywhere except to Netlify.
- **Sessions are cookies, so CSRF is now a real concern.** A bearer token had to
  be attached deliberately by our own script; a cookie is attached by the browser
  whether we like it or not. Every non-GET route therefore has its `Origin`
  checked before anything else happens.
- **Email confirmation and password reset are ours to route.** Clerk hosted those
  pages. Identity mails a link back to the site with the token in the URL
  fragment, and nothing else will spend it, so `mathit-auth.js` reads the
  fragment and posts it to `/api/auth/confirm` or shows the reset form.

The temporary-password flow is unchanged from the Clerk version and for the same
reason: no provider here has Keycloak's `UPDATE_PASSWORD` required action, so
tutor-created students carry `students.must_change_password`, every practice
route refuses them while it is set, and `POST /api/me/password` is the only way
out.

### Other providers

`IDENTITY_PROVIDER=clerk` and `IDENTITY_PROVIDER=keycloak` still work.
`netlify/lib/identity/` is the only directory that knows the difference, and
`/api/config` tells the frontend which of the two sign-in shapes to render —
a form for Netlify Identity, a redirect for the OIDC providers. See
`.env.example` for what each one needs.

## Running it locally

The full stack, with sign-in and the admin console:

```bash
docker compose up -d --build
```

| | |
|---|---|
| Practice app | http://localhost:9090 |
| Admin console | http://localhost:9090/admin.html |
| Keycloak | http://localhost:8081 (`admin` / `admin`) |
| API | http://localhost:3000/api/health |

A `tutor` / `tutor` admin account is created by the realm import. Sign in with
it at the admin console to approve the first students. **These are development
credentials** — see the environment variables in `docker-compose.yml` before
running this anywhere real, and change the `mathit-api` client secret.

### `MathIT.html` is no longer standalone

Adding accounts changed this. The page now loads `/mathit-auth.js` and calls
`/api/config` during start-up, so serving the file on its own (`./serve.py`,
Netlify, opening it from disk) shows a **"Cannot reach MathIT"** screen instead
of the activities. `serve.py` serves the file but not `web/` or the API, so it
no longer gets you a working app on its own.

On Netlify that is fine — the function is deployed alongside it and answers
`/api/config` on the same origin. It only bites when the file is served on its
own: use `docker compose up`, or `netlify dev`, or pin to the last pre-accounts
commit (`614cfa1`) if all you want is the sign-in-free app.

### In a container

```bash
docker build -t mathit .
docker run --rm -p 8080:80 mathit
# then open http://localhost:8080/
```

This uses `Dockerfile` (nginx serving the static file as `index.html`) and needs a
container registry reachable to pull `nginx:alpine`.

**If your network blocks Docker Hub / GHCR** (e.g. a locked-down CI runner or sandbox —
this is the situation this repo was first containerized in), use the registry-free
variant instead, which builds `FROM scratch` with no external pulls at all:

```bash
docker-offline/build.sh          # stages a local Node binary + its shared libs, builds mathit:offline
docker run --rm -p 8080:8080 mathit:offline
# then open http://localhost:8080/
```

`build.sh` only needs `node`, `ldd`, and `docker` on the host — it copies whatever
Node binary is on `PATH` plus its handful of shared-library dependencies into
`docker-offline/rootfs/` and builds from that, so the resulting image has nothing in
it but that one static file server and `MathIT.html`. Verified working end to end
(built, ran, and loaded correctly in a headless browser with zero console errors)
in the environment this was first set up in, where `registry-1.docker.io` and
`ghcr.io` both returned `403 Forbidden`.
