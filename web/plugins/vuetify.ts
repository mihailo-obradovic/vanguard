import '@mdi/font/css/materialdesignicons.css';

import 'vuetify/styles';
import { createVuetify } from 'vuetify';

const baseColors = {
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
  theme: {
    defaultTheme: 'light',

    themes: {
      light: {
        isDark: false,

        colors: {
          background: '#f8f8f2',
          foreground: '#282a36',
          ...baseColors
        }
      },

      dark: {
        isDark: true,

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
  const vuetify = createVuetify(options);

  app.vueApp.use(vuetify);
});
