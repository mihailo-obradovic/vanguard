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
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/image',
    '@nuxt/test-utils/module',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    'dayjs-nuxt'
  ],

  css: ['@/assets/styles/main.scss'],

  components: {
    dirs: ['@/components/shared']
  },

  imports: {
    dirs: ['services']
  },

  compatibilityDate: '2025-03-01'
});
