// ! Import component theme configs by relative path only — app.config.ts is loaded before the
// ! alias map exists, so '@/config/nuxt-ui/…' fails the build (catalyst/stacks/frontend/nuxt/ui/nuxtui/customization.md).
import alert from './config/nuxt-ui/alert';
import badge from './config/nuxt-ui/badge';
import button from './config/nuxt-ui/button';
import card from './config/nuxt-ui/card';
import footer from './config/nuxt-ui/footer';
import formField from './config/nuxt-ui/form-field';
import header from './config/nuxt-ui/header';
import input from './config/nuxt-ui/input';
import modal from './config/nuxt-ui/modal';
import table from './config/nuxt-ui/table';

export default defineAppConfig({
  ui: {
    colors: {
      primary: 'primary',
      secondary: 'secondary',
      success: 'success',
      info: 'info',
      warning: 'warning',
      error: 'error',
      neutral: 'dracula'
    },

    alert,
    badge,
    button,
    card,
    footer,
    formField,
    header,
    input,
    modal,
    table
  }
});
