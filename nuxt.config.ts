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

    plugins: [vuetify({ autoImport: true })],

    optimizeDeps: {
      // @regle/nuxt's runtime plugin resolves the raw copy of @regle/core
      // while app code gets the pre-bundled one; the two module instances
      // carry different injection symbols, which triggers a bogus "Regle
      // Devtools are not available" console warning. Excluding both (rules
      // imports core) keeps a single instance. Dev-only setting.
      exclude: ['@regle/core', '@regle/rules']
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

  css: ['vuetify/styles', '@/assets/styles/main.css'],

  components: {
    dirs: ['@/components/shared']
  },

  imports: {
    dirs: ['services']
  },

  compatibilityDate: '2025-07-25'
});
