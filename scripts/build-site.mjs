/**
 * Stages the published site into dist/.
 *
 * Deliberately a copy rather than a `publish = "."`: the repo root holds
 * backend/, keycloak/realm-mathit.json and the superseded prototypes, none of
 * which should ever be reachable over HTTP. Copying an explicit list is the
 * same guarantee web/nginx.conf gave with its location allow-list.
 */
import { mkdir, copyFile, rm, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const FILES = [
  ['MathIT.html',          'dist/index.html'],
  ['web/admin.html',       'dist/admin.html'],
  ['web/mathit-auth.js',   'dist/mathit-auth.js'],
  // index.html frames this one in an iframe (src="fractopia.html"), so it has
  // to be served from the site root alongside it or the Fractopia tab 404s.
  // It is deliberately self-contained, with its font embedded as a data URI
  // the same way index.html does it, so adding it widens the published surface
  // by exactly one file: no stylesheet and no font file travel with it.
  ['fractopia.html',       'dist/fractopia.html'],
  // A standalone marketing preview, deliberately a separate file rather than
  // a mode inside MathIT.html, so nothing here can ever affect the real app.
  // It is NOT kept in sync automatically - see the comment near the top of
  // preview.html.
  ['preview.html',         'dist/preview.html'],
];

// Whole directories to copy as-is, for self-contained sub-sites that ship
// with their own JS/CSS/image assets rather than a single HTML file. Kept
// separate from FILES above (which stays one line per file, on purpose, so
// the allow-list for the main app is still readable at a glance) - each
// entry here is still a conscious, named addition to what gets published,
// just one whose contents come from its own existing folder instead of
// being retyped file by file.
const DIRS = [
  // Measure Arcade: a standalone Grade 6 measurement game (its own static
  // site, talking to its own Supabase project - see measure-arcade/config.js,
  // and measure-arcade-README.md at the repo root for how it was built and
  // how to point it at a different Supabase project). Linked from the Games
  // tab, opened in a new tab; it shares no code or login with the rest of
  // MathIT, so nothing else here changes to support it.
  ['measure-arcade',       'dist/measure-arcade'],
];

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });

for (const [from, to] of FILES) {
  await copyFile(from, to);
  console.log(`  ${from} -> ${to}`);
}

async function copyDir(from, to) {
  await mkdir(to, { recursive: true });
  const entries = await readdir(from, { withFileTypes: true });
  for (const entry of entries) {
    const src = join(from, entry.name), dest = join(to, entry.name);
    if (entry.isDirectory()) await copyDir(src, dest);
    else await copyFile(src, dest);
  }
}
let dirFileCount = 0;
for (const [from, to] of DIRS) {
  await copyDir(from, to);
  const entries = await readdir(from, { recursive: true });
  dirFileCount += entries.length;
  console.log(`  ${from}/ -> ${to}/ (${entries.length} files)`);
}

console.log(`staged ${FILES.length} files and ${DIRS.length} director${DIRS.length === 1 ? 'y' : 'ies'} (${dirFileCount} files) into dist/`);
