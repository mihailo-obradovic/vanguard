import { defineVitestConfig } from '@nuxt/test-utils/config';

export default defineVitestConfig({
	test: {
		coverage: {
			provider: 'v8',
			// * Measure the whole frontend source tree, not just files a test happens to import
			include: ['web/**'],
			// * Locale catalogs are data, not code; measuring them only dilutes the numbers
			exclude: ['web/i18n/locales/**'],
			reporter: ['text', 'html', 'lcov'],
		},
	},
});
