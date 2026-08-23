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

// * WCAG 2.x relative luminance and contrast ratio, computed from the sRGB hex Vuetify hands back.
// * Inline rather than a dependency: this is the only place the project measures contrast, and the
// * formula is fixed by the specification, so there is nothing to keep up to date.
function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((offset) => {
    const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;

    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);

  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

// * Vuetify types a theme colour as its whole accepted input union (hex, HSV, RGB). By the time one
// * reaches `computedThemes` it is a resolved hex string, which is what these ratios need — so this
// * throws on anything else rather than casting the problem away.
function hexOf(color: unknown): string {
  if (typeof color !== 'string' || !/^#[0-9a-f]{6}$/i.test(color)) {
    throw new TypeError(`Expected a resolved hex colour, got ${String(color)}`);
  }

  return color;
}

// * The roles that render as foreground somewhere: `variant="text"` and `variant="outlined"` buttons
// * paint their label and border with the colour itself, so these are real text. `secondary` and
// * `highlight` are excluded on purpose — they are only ever fills, and Vuetify computes what lands
// * on top of them.
const FOREGROUND_ROLES = [
  'primary',
  'accent',
  'error',
  'warning',
  'info',
  'success',
  'link'
] as const;

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
  // ! The regression that guards the per-mode split. Dracula is drawn for a dark ground: shipped
  // ! unchanged on the light face, every accent lands between 1.29:1 and 4.41:1 as text. Measured
  // ! from the computed tokens rather than the declared ones, and against both the page and the
  // ! surface a button can sit on, so it fails whichever way one shared palette is reintroduced.
  describe.each(['light', 'dark'] as const)('the %s theme', (name) => {
    it.each(FOREGROUND_ROLES)(
      'keeps `%s` legible as text on both the page and a surface',
      (role) => {
        const theme = install().theme.computedThemes.value[name]!;
        const accent = hexOf(theme.colors[role]);

        for (const ground of [
          hexOf(theme.colors.background),
          hexOf(theme.colors.surface)
        ]) {
          const ratio = contrastRatio(accent, ground);

          expect(
            ratio,
            `${role} ${accent} on ${ground} is ${ratio.toFixed(2)}:1`
          ).toBeGreaterThanOrEqual(4.5);
        }
      }
    );
  });
});
