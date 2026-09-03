import { createVuetify } from 'vuetify';
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg';
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n';
import { useI18n } from 'vue-i18n';

// * Dracula's current-line grey, behind the drawer, the empty layout and the role chip. One value
// * serves both faces, and it is the one fill Vuetify's own contrast pick gets right on both:
// * white content at 9.15:1 either way.
const fillColors = {
  secondary: '#44475a'
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
  link: '#57638a',
  'scroll-edge': '#6272a4'
};

// ! `scroll-edge` is split across the two faces for the same reason the accents are, but against a
// ! different floor: it marks an edge that is hiding content, so it carries information and answers
// ! to WCAG 1.4.11 at 3:1 against the ground behind it, not the 4.5:1 text floor. One shared value
// ! would have to sit in the narrow band that clears 3:1 on both `#f8f8f2` and `#282a36`; Dracula's
// ! comment `#6272a4` only just does on the dark face (3.03:1), so each face takes its own —
// ! 4.41:1 light, 4.10:1 dark. Ratios in decisions/010.
const darkAccents = {
  primary: '#bd93f9',
  accent: '#ff79c6',
  error: '#ff5555',
  warning: '#ffb86c',
  info: '#8be9fd',
  success: '#50fa7b',
  link: '#939fbf',
  'scroll-edge': '#8189a3'
};

// ! What lands ON a filled accent is the other axis from the split above, and Vuetify cannot be
// ! trusted with it here. Its pick is `whiteContrast > Math.min(blackContrast, 50)` (APCA, in
// ! `vuetify/lib/util/colorUtils.js`) — deliberately biased to white, with no threshold to
// ! configure. On Dracula's dark pastels that bias is wrong by a wide margin: white on `primary`
// ! measures 2.41:1 where black measures 8.71:1, and `primary` is the app bar, so it is the most
// ! visible text in the app. Declaring `on-<role>` short-circuits the pick entirely
// ! (`theme.js`: `if (color.startsWith('on-') || colors['on-' + color]) continue`).
// * Only the four Vuetify gets wrong are listed. It already picks black on the dark `warning` and
// * `info`, and white on the light face throughout — the spec measures every fill on both faces,
// * so a role left out here is guarded, not assumed. Ratios are in decisions/010.
const darkOnAccents = {
  'on-primary': '#000000',
  'on-accent': '#000000',
  'on-error': '#000000',
  'on-success': '#000000'
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
          ...darkAccents,
          ...darkOnAccents
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
