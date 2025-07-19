import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';

export default defineNuxtConfig({
  devtools: { enabled: ['local', 'development'].includes(process.env.APP_ENV) },

  srcDir: 'web/',

  ssr: false,

  runtimeConfig: {
    app: {
      environment: process.env.APP_ENV // Can be overriden with NUXT_APP_APP_ENV
    },

    public: {
      apiBaseUrl: ''
    }
  },

  build: { transpile: ['vuetify'] },

  vite: {
    vue: {
      template: {
        transformAssetUrls
      }
    },

    plugins: [vuetify({ autoImport: true })]
  },

  modules: [
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/image',
    '@nuxt/test-utils/module',
    '@nuxtjs/i18n',
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
