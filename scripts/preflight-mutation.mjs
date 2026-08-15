// * Both ways the frontend mutation run breaks report something unrelated to the cause, so they are
// * checked here instead: each costs an hour of misdirected debugging otherwise (catalyst/operations.md).
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function fail(problem, fix) {
  console.error(`\npreflight: ${problem}\n  fix: ${fix}\n`);
  process.exit(1);
}

// ! Without it every spec dies in oxc with TSCONFIG_ERROR and Stryker reports a bare "No tests were found".
if (!existsSync(resolve(root, '.nuxt/tsconfig.app.json'))) {
  fail(
    '.nuxt/tsconfig.app.json is missing, so the sandbox has no tsconfig to reference',
    'pnpm nuxt prepare'
  );
}

// ! A pnpm command run with a cwd inside .stryker-tmp rewrites the REAL manifest to point at the
// ! sandbox; every later pnpm command then demands to purge node_modules.
const manifest = resolve(root, 'node_modules/.modules.yaml');

if (
  existsSync(manifest) &&
  readFileSync(manifest, 'utf8').includes('.stryker-tmp')
) {
  fail(
    'node_modules/.modules.yaml points into the Stryker sandbox',
    'CI=true pnpm install --frozen-lockfile, from the project root'
  );
}
