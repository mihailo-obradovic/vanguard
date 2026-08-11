import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';

export default defineNuxtConfig({
  devtools: { enabled: ['local', 'development'].includes(process.env.APP_ENV ?? '') },

  srcDir: 'web/',

  ssr: false,

  runtimeConfig: {
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
    '@nuxt/fonts',
    '@nuxt/image',
    '@nuxt/test-utils/module',
    '@pinia/nuxt',
    '@pinia/colada-nuxt',
    '@regle/nuxt',
    '@vueuse/nuxt'
  ],

  css: ['vuetify/styles', '@/assets/styles/main.css'],

  components: {
    dirs: ['@/components/shared']
  },

  imports: {
    dirs: ['services']
  },

  compatibilityDate: '2025-07-25'
});
