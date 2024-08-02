import '@mdi/font/css/materialdesignicons.css';

import 'vuetify/styles';
import { createVuetify } from 'vuetify';

const options = {
  theme: {
    defaultTheme: 'dark',

    themes: {
      dark: {
        isDark: true,

        colors: {
          primary: '#bd93f9',
          secondary: '#44475a',
          accent: '#ff79c6',
          error: '#ff5555',
          warning: '#ffb86c',
          info: '#8be9fd',
          success: '#50fa7b',
          background: '#282a36',
          foreground: '#f8f8f2',
          comment: '#6272a4', // TODO: Rename to something more fitting
          yellow: '#f1fa8c' // TODO: Rename to something more fitting
        }
      },

      light: {
        isDark: false,

        colors: {
          primary: '#bd93f9',
          secondary: '#44475a',
          accent: '#ff79c6',
          error: '#ff5555',
          warning: '#ffb86c',
          info: '#8be9fd',
          success: '#50fa7b',
          background: '#f8f8f2',
          foreground: '#282a36',
          comment: '#6272a4', // TODO: Rename to something more fitting
          yellow: '#f1fa8c' // TODO: Rename to something more fitting
        }
      }
    }
  }
};

export default defineNuxtPlugin((app) => {
  const vuetify = createVuetify(options);

  app.vueApp.use(vuetify);
});
