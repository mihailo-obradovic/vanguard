import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';

export default defineNuxtConfig({
  devtools: {
    enabled: ['local', 'development'].includes(process.env.APP_ENV ?? '')
  },

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
      // ! @regle/nuxt resolves its own raw copy of @regle/core at runtime while the app gets the pre-bundled one; the differing injection symbols trigger a bogus "Regle Devtools are not available" warning — excluding both keeps a single instance in dev.
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

  compatibilityDate: '2026-08-11'
});
