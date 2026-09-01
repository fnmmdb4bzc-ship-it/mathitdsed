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
];

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });

for (const [from, to] of FILES) {
  await copyFile(from, to);
  console.log(`  ${from} -> ${to}`);
}
console.log(`staged ${FILES.length} files into dist/`);
