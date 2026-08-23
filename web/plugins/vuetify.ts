import { createVuetify } from 'vuetify';
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg';
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n';
import { useI18n } from 'vue-i18n';

// * Fill-only roles, so one value serves both faces: Vuetify computes the contrast text that lands on
// * them. `secondary` is Dracula's current-line grey behind the drawer, the empty layout and the role
// * chip; `highlight` is declared for parity with the palette and is not yet used anywhere.
const fillColors = {
  // * Force white content on success surfaces; Vuetify's computed contrast would pick black on this light green
  'on-success': '#ffffff',
  secondary: '#44475a',
  highlight: '#f1fa8c'
};

// ! The accents cannot be one shared set. Dracula is drawn for a dark ground, and every pastel here
// ! lands between 1.29:1 and 4.41:1 as foreground on the light page — `variant="text"` and
// ! `variant="outlined"` buttons paint with the colour itself, so those ratios are real text. The
// ! light face therefore takes the darkest shade of each hue that still reaches 4.5:1, matching what
// ! variant/nuxtui already does; the dark face keeps Dracula as published. Ratios are in decisions/010.
const lightAccents = {
  primary: '#8144c5',
  accent: '#bf0086',
  error: '#db0026',
  warning: '#8c5400',
  info: '#007687',
  success: '#007d2f',
  link: '#57638a'
};

const darkAccents = {
  primary: '#bd93f9',
  accent: '#ff79c6',
  error: '#ff5555',
  warning: '#ffb86c',
  info: '#8be9fd',
  success: '#50fa7b',
  link: '#939fbf'
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
          ...fillColors,
          ...lightAccents
        }
      },

      dark: {
        dark: true,

        colors: {
          background: '#282a36',
          foreground: '#f8f8f2',
          ...fillColors,
          ...darkAccents
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
