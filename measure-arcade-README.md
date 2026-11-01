# Measure Arcade

Grade 6 Term 4 measurement games (mass, capacity, time) with a teacher view and
learner views. By Debby Smit Educational Therapy.

Live at: https://measure-arcade.netlify.app

## What is in this folder

site/                 The website. Upload this folder to Netlify as it is.
  index.html          Page shell: logo, title, footer. Loads the three scripts below.
  app.js              All the game logic: start screens, teacher view, learner view,
                      the four games, live connection and the lesson summary.
  style.css           All the styling (sage theme, light and dark mode).
  config.js           Supabase address and public key. Change this to use another project.
  supabase.js         Supabase library (version 2.45.4), bundled so nothing loads from a CDN.
  591.supabase.js     Small extra file that the Supabase library needs.
  logo.png            Your logo (dark version). logo-light.png is for dark mode.
  favicon.svg, apple-touch-icon.png   Browser tab and Home Screen icons.
  netlify.toml        Netlify settings (no build step needed).
database/setup.sql    Creates the two game tables, their access rules and the daily clean-up.

## How it works

- No build step and no framework. Plain HTML, CSS and JavaScript.
- The teacher creates a "room" with a 4 letter code (table arcade_rooms).
  The room holds the current game and its questions.
- Each learner who joins gets a row in arcade_players holding their progress.
- Both views listen for changes through Supabase Realtime, and also refresh
  every 4 seconds as a backup.
- Everything is deleted automatically one day after the lesson starts.

## Where to find each game in app.js

- Question makers (teacher side): genBingo, genCourier, genBakery, genTrain
- Teacher screens: tBingo, tCourier, tBakery, tTrain
- Learner screens: lBingo, lCourier, lBakery, lTrain (button handling in hlBingo and so on)
- Scale and jug drawings: scaleSVG, jugSVG
- Lesson summary: summaryText

## Adding it to MathIT

MathIT uses its own login and backend. Measure Arcade uses Supabase and has no
login. The simplest way to combine them:

1. Copy the site folder into the MathIT repo as a subfolder, for example
   web/measure-arcade/ (or wherever MathIT serves its static files).
2. Add a button or link in MathIT that opens measure-arcade/index.html.
3. Keep config.js pointing at your Supabase project. Nothing else in MathIT changes.

Deeper integration (using MathIT logins, or saving results into MathIT learner
records) would mean rewriting the live connection in app.js to use the MathIT
backend instead of Supabase.

## Note on how this was added to MathIT

This followed the "Simple link-out" path this file itself recommends: the
`site/` folder's contents were copied as-is into `measure-arcade/` at the
MathIT repo root (its own `netlify.toml` was left out - MathIT's own root
`netlify.toml` governs the whole published site now), `scripts/build-site.mjs`
was extended to publish that folder to `dist/measure-arcade/`, and a Games
tab tile ("Measure Arcade", in MathIT.html's ACTIVITIES/SECTIONS_BY_LEVEL/
goTo builders) opens `measure-arcade/index.html` in a new tab. MathIT's own
sign-in still gates the tile (only a signed-in, approved profile ever sees
the Games tab), but once that tab opens, Measure Arcade runs entirely on its
own Supabase project with no further connection to MathIT's login or
database - exactly as designed here. `database/setup.sql` was not run against
any new database; it is assumed the existing Supabase project named in
`measure-arcade/config.js` already has it applied.
