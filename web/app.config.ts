// ! Import component theme configs by relative path only — app.config.ts is loaded before the
// ! alias map exists, so '@/config/nuxt-ui/…' fails the build (catalyst/stacks/frontend/nuxt/ui/nuxtui/customization.md).

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
    }
  }
});
