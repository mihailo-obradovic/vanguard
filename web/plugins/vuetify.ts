import { createVuetify } from 'vuetify';
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg';
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n';
import { useI18n } from 'vue-i18n';

const baseColors = {
  // * Force white content on success surfaces; Vuetify's computed contrast would pick black on this light green
  'on-success': '#ffffff',
  primary: '#bd93f9',
  secondary: '#44475a',
  accent: '#ff79c6',
  error: '#ff5555',
  warning: '#ffb86c',
  info: '#8be9fd',
  success: '#50fa7b',
  link: '#6272a4',
  highlight: '#f1fa8c'
};

const options = {
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi }
  },

  theme: {
    defaultTheme: 'light',

    themes: {
      light: {
        dark: false,

        colors: {
          background: '#f8f8f2',
          foreground: '#282a36',
          ...baseColors
        }
      },

      dark: {
        dark: true,

        colors: {
          background: '#282a36',
          foreground: '#f8f8f2',
          ...baseColors
        }
      }
    }
  }
};

export default defineNuxtPlugin((app) => {
  // * Routes Vuetify's own strings (data table, pagination) through the app's catalogs, so one locale switch moves everything. The $vuetify trees live in web/i18n/i18n.config.ts.
  const vuetify = createVuetify({
    ...options,
    locale: {
      // * The adapter wants an I18n instance; Nuxt exposes the Composer, which is that instance's `global`.
      adapter: createVueI18nAdapter({
        i18n: { global: app.$i18n } as Parameters<
          typeof createVueI18nAdapter
        >[0]['i18n'],
        useI18n
      })
    }
  });

  app.vueApp.use(vuetify);
});
