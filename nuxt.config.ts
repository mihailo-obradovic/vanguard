export default defineNuxtConfig({
  devtools: { enabled: true },

  srcDir: 'web/',

  ssr: false,

  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/test-utils/module',
    '@nuxtjs/i18n',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    'dayjs-nuxt',
    'nuxt-lodash'
  ],

  lodash: {
    prefix: '_',
    upperAfterPrefix: false
  }
});
