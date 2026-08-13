import { defineVitestConfig } from '@nuxt/test-utils/config';
import { defaultExclude } from 'vitest/config';

// * Tests talk to an absolute origin so MSW can intercept them — a relative base URL would leave
// * the requests unroutable in Node. Set before the Nuxt config loads so it wins over `.env`.
process.env.NUXT_PUBLIC_API_BASE_URL = 'http://api.test';

export default defineVitestConfig({
  test: {
    setupFiles: ['web/mocks/setup.ts'],
    // ! Nested checkouts of this repo are collected as if they were part of it, and every spec
    // ! then runs twice — once against the wrong tree. A crashed Stryker run leaves its sandbox
    // ! behind, and `.claude/worktrees/` holds agent worktrees; vitest's defaults skip neither.
    exclude: [
      ...defaultExclude,
      '**/.stryker-tmp/**',
      '**/.claude/worktrees/**'
    ],
    coverage: {
      provider: 'v8',
      // * Measure the whole frontend source tree, not just files a test happens to import.
      // ! Extension-filtered on purpose: a bare `web/**` hands the docs to rolldown, which
      // ! fails to parse them as source and logs a PARSE_ERROR per file.
      include: ['web/**/*.{ts,vue}'],
      // * Locale catalogs are data, not code; measuring them only dilutes the numbers.
      // * `mocks/` is test infrastructure, not shipped code.
      exclude: ['web/i18n/locales/**', 'web/mocks/**'],
      reporter: ['text', 'html', 'lcov']
    }
  }
});
