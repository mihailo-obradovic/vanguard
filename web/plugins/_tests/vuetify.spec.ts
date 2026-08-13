// @vitest-environment nuxt
import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import type { createVuetify } from 'vuetify';

import vuetifyPlugin from '../vuetify';

type Vuetify = ReturnType<typeof createVuetify>;

// * A Composer stand-in shaped like what Nuxt puts on `$i18n` — enough of one for the locale
// * adapter to read through. Vue I18n itself is not the unit here.
function createComposer(locale = 'en') {
  return {
    locale: ref(locale),
    fallbackLocale: ref('en'),
    messages: ref({}),
    t: (key: string) => key,
    n: (value: number) => String(value)
  };
}

type App = {
  $i18n: ReturnType<typeof createComposer>;
  vueApp: { use: (plugin: unknown) => void };
};

// * The plugin's only observable output is the Vuetify instance it hands to `vueApp.use`.
function install(composer = createComposer()): Vuetify {
  let vuetify: Vuetify | undefined;

  const app: App = {
    $i18n: composer,
    vueApp: {
      use: (plugin: unknown) => {
        vuetify = plugin as Vuetify;
      }
    }
  };

  // * Cast because the plugin is declared against the full NuxtApp; it only ever touches these two.
  (vuetifyPlugin as unknown as (app: App) => void)(app);

  if (!vuetify) {
    throw new Error('The plugin installed nothing on the Vue app');
  }

  return vuetify;
}

describe('the Vuetify plugin', () => {
  // ! The adapter wants an I18n instance and Nuxt exposes the Composer, so the plugin has to pass
  // ! it as `{ global: app.$i18n }`. Handing over `app.$i18n` itself leaves the locale unresolved,
  // ! which is invisible until a Vuetify-owned string renders.
  it('reads its locale from the app’s i18n instance', () => {
    const vuetify = install(createComposer('sr-Latn'));

    expect(vuetify.locale.current.value).toBe('sr-Latn');
  });

  it('follows the app’s i18n instance when the locale changes', () => {
    const composer = createComposer('en');
    const vuetify = install(composer);

    composer.locale.value = 'sr-Cyrl';

    expect(vuetify.locale.current.value).toBe('sr-Cyrl');
  });

  it('registers a light and a dark theme', () => {
    const themes = install().theme.themes.value;

    expect(themes.light).toMatchObject({ dark: false });
    expect(themes.dark).toMatchObject({ dark: true });
  });

  // ! Asserted on the computed themes rather than the declared ones: Vuetify derives contrast text
  // ! per surface and picks black over this light green, so dropping the override does not leave a
  // ! hole here — it silently yields black. A change is a legibility regression, not a preference.
  it('forces white content on success surfaces in both themes', () => {
    const themes = install().theme.computedThemes.value;

    expect(themes.light).toMatchObject({ colors: { 'on-success': '#ffffff' } });
    expect(themes.dark).toMatchObject({ colors: { 'on-success': '#ffffff' } });
  });
});
