export default defineNuxtConfig({
  devtools: { enabled: true },

  srcDir: 'web/',

  ssr: false,

  modules: [
    '@nuxt/eslint',
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
