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

Not included: the Word-document deliverables (`Grade6_Maths_Intervention_Plan.docx`,
`Practice_App_Manipulatives_Pack.docx`) and their generator scripts (`build.js`,
`build_manipulatives.js`). Those produce separate print deliverables, not this web app,
so they were left out of this repository.

## Running it locally

It's a static file, so any static file server works:

```bash
python3 -m http.server 8080
# then open http://localhost:8080/MathIT.html
```

### In a container

```bash
docker build -t mathit .
docker run --rm -p 8080:80 mathit
# then open http://localhost:8080/
```

See `Dockerfile` (nginx serving the static file as `index.html`).
