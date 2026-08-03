export default defineNuxtConfig({
  devtools: { enabled: ['local', 'development'].includes(process.env.APP_ENV) },

  srcDir: 'web/',

  ssr: false,

  runtimeConfig: {
    environment: process.env.APP_ENV,

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

  components: {
    dirs: ['@/components/shared']
  },

  imports: {
    dirs: ['services']
  },

  compatibilityDate: '2025-03-01'
});
