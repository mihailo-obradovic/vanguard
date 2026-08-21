export default defineNuxtConfig({
  devtools: {
    enabled: ['local', 'development'].includes(process.env.APP_ENV ?? '')
  },

  srcDir: 'web/',

  ssr: false,
  spaLoadingTemplate: true,

  runtimeConfig: {
    public: {
      apiBaseUrl: ''
    }
  },

  modules: [
    '@nuxt/fonts',
    '@nuxt/image',
    '@nuxt/test-utils/module',
    '@nuxtjs/i18n',
    '@pinia/nuxt',
    '@pinia/colada-nuxt',
    '@regle/nuxt',
    '@vueuse/nuxt'
  ],

  regle: {
    setupFile: '@/regle-config.ts'
  },

  i18n: {
    // * The module resolves its directory from rootDir, not srcDir — pointing it at web/ keeps the catalogs with the rest of the frontend.
    restructureDir: 'web/i18n',
    defaultLocale: 'en',
    // * No locale in the URL: this is a client-only SPA behind login with no SEO surface, so prefixes would only cost localePath() on every link (ADR 006).
    strategy: 'no_prefix',
    locales: [
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
      {
        code: 'sr-Latn',
        language: 'sr-Latn-RS',
        name: 'Srpski',
        file: 'sr-Latn.json'
      },
      {
        code: 'sr-Cyrl',
        language: 'sr-Cyrl-RS',
        name: 'Српски',
        file: 'sr-Cyrl.json'
      }
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_locale',
      fallbackLocale: 'en'
    }
  },

  css: ['@/assets/styles/main.css'],

  vite: {
    optimizeDeps: {
      // ! @regle/nuxt resolves its own raw copy of @regle/core at runtime while the app gets the pre-bundled one; the differing injection symbols trigger a bogus "Regle Devtools are not available" warning — excluding both keeps a single instance in dev.
      exclude: ['@regle/core', '@regle/rules']
    }
  },

  components: {
    dirs: ['@/components/_shared']
  },

  imports: {
    dirs: ['services']
  },

  compatibilityDate: '2026-08-11'
});
