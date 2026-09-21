/**
 * Stages the published site into dist/.
 *
 * Deliberately a copy rather than a `publish = "."`: the repo root holds
 * backend/, keycloak/realm-mathit.json and the superseded prototypes, none of
 * which should ever be reachable over HTTP. Copying an explicit list is the
 * same guarantee web/nginx.conf gave with its location allow-list.
 */
import { mkdir, copyFile, rm } from 'node:fs/promises';

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
];

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });

for (const [from, to] of FILES) {
  await copyFile(from, to);
  console.log(`  ${from} -> ${to}`);
}
console.log(`staged ${FILES.length} files into dist/`);
