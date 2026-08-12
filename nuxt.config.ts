export default defineNuxtConfig({
  devtools: {
    enabled: ['local', 'development'].includes(process.env.APP_ENV ?? '')
  },

  srcDir: 'web/',

  ssr: false,

  runtimeConfig: {
    public: {
      apiBaseUrl: ''
    }
  },

  modules: [
    '@nuxt/fonts',
    '@nuxt/image',
    '@nuxt/test-utils/module',
    '@pinia/nuxt',
    '@pinia/colada-nuxt',
    '@regle/nuxt',
    '@vueuse/nuxt'
  ],

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
