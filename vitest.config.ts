import { defineVitestConfig } from '@nuxt/test-utils/config';

// * Tests talk to an absolute origin so MSW can intercept them — a relative base URL would leave
// * the requests unroutable in Node. Set before the Nuxt config loads so it wins over `.env`.
process.env.NUXT_PUBLIC_API_BASE_URL = 'http://api.test';

export default defineVitestConfig({
  test: {
    setupFiles: ['web/mocks/setup.ts'],
    coverage: {
      provider: 'v8',
      // * Measure the whole frontend source tree, not just files a test happens to import
      include: ['web/**'],
      // * Locale catalogs are data, not code; measuring them only dilutes the numbers.
      // * `mocks/` is test infrastructure, not shipped code.
      exclude: ['web/i18n/locales/**', 'web/mocks/**'],
      reporter: ['text', 'html', 'lcov']
    }
  }
});
