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

  hooks: {
    'pages:extend'(pages) {
      pages.forEach((page) => {
        if (page.name) {
          page.path = page.path
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .toLowerCase();
        }
      });

      pages.push(
        {
          name: 'Home',
          path: '/',
          alias: '/home',
          file: '@/pages/Home.vue'
        },
        {
          name: 'Password Reset',
          path: '/password-reset/:token',
          file: '@/pages/PasswordReset.vue'
        }
      );
    }
  },

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
