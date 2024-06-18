// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  srcDir: 'web/',

  ssr: false,

  modules: ['@pinia/nuxt', '@nuxt/eslint', 'dayjs-nuxt', 'nuxt-lodash'],

  lodash: {
    prefix: '_',
    upperAfterPrefix: false
  }
});
