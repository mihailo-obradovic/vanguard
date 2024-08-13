import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';

export default defineNuxtConfig({
  devtools: { enabled: true },

  srcDir: 'web/',

  ssr: false,

  build: { transpile: ['vuetify'] },

  hooks: {
    'pages:extend'(pages) {
      pages.forEach((page) => {
        if (page.name) {
          page.path = page.path
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .toLowerCase();
        }
      });

      pages.push({
        name: 'Home',
        path: '/',
        alias: '/home',
        file: '@/pages/Home.vue'
      });
    },

    'vite:extendConfig'(config) {
      config.plugins?.push(vuetify({ autoImport: true }));
    }
  },

  vite: {
    vue: {
      template: {
        transformAssetUrls
      }
    }
  },

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
  },

  css: ['@/assets/styles/main.scss'],

  components: {
    dirs: ['@/components/shared']
  }
});
