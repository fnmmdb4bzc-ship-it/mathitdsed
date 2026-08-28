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
- **`backend/`** — the MathIT API (Node + Express + Postgres): student records,
  approval state, and practice progress. Migrations in `backend/migrations/`
  run automatically at start-up.
- **`keycloak/realm-mathit.json`** — the Keycloak realm, imported on first
  start: roles, clients, self-registration settings, and a `tutor` admin user.
- **`web/`** — `admin.html` (the practice admin console), `mathit-auth.js`
  (OIDC/PKCE sign-in and API client), and the nginx config.
- **`serve.py`** — static dev server that serves `MathIT.html` at `/`. Only
  useful for the standalone, sign-in-free version of the app.

## Accounts and data

Since students now sign in individually, the app is no longer a single static
file — it is a small stack:

| Piece | Owns |
|---|---|
| Keycloak | identity: credentials, sessions, roles, self-registration |
| Postgres | student records, approval state, streaks, per-topic scores |
| API | authorisation, progress recording, admin operations |
| nginx | serves the app and proxies `/api` same-origin |

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

**Two deliberate Keycloak settings** (realm JSON carries no comments, so they
are recorded here):

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
students directly (created in Keycloak with a temporary password), disable or
delete them, and see who is online right now — the online flag reads live
Keycloak sessions, so it means "signed in this moment", not merely "enabled".

Not included: the Word-document deliverables (`Grade6_Maths_Intervention_Plan.docx`,
`Practice_App_Manipulatives_Pack.docx`) and their generator scripts (`build.js`,
`build_manipulatives.js`). Those produce separate print deliverables, not this web app,
so they were left out of this repository.

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

That matters for the Netlify deployment, which publishes `MathIT.html` alone —
it will need the API and Keycloak reachable, or to be pinned to the last
pre-accounts commit (`614cfa1`). Use `docker compose up` for a working local
instance.

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
