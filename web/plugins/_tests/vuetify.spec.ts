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
// ! Shorthand is expanded rather than rejected: the `on-` colours Vuetify computes itself come from
// ! its `theme-on-dark` / `theme-on-light` variables, which ship as `#FFF` and `#000`. Only the
// ! declared colours are six digits, so a six-digit-only guard would pass every overridden token
// ! and throw on exactly the ones left to Vuetify's pick — the half most worth measuring.
function hexOf(color: unknown): string {
  if (
    typeof color !== 'string' ||
    !/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color)
  ) {
    throw new TypeError(`Expected a resolved hex colour, got ${String(color)}`);
  }

  const expanded =
    color.length === 4
      ? `#${color.slice(1).replace(/./g, (digit) => digit + digit)}`
      : color;

  // * Lowercased so the result is comparable, not only measurable: Vuetify's own values arrive
  // * upper-case (`#FFF`) and the theme's declared ones lower-case.
  return expanded.toLowerCase();
}

// * The roles that render as foreground somewhere: `variant="text"` and `variant="outlined"` buttons
// * paint their label and border with the colour itself, so these are real text. `secondary` is
// * excluded because it is never a foreground — it is covered by FILL_ROLES below instead.
const FOREGROUND_ROLES = [
  'primary',
  'accent',
  'error',
  'warning',
  'info',
  'success',
  'link'
] as const;

// * The roles that get painted as a surface with content on top: `variant="flat"` buttons, the app
// * bar, the drawer, the fullscreen dialog's toolbar. `link` is absent because nothing fills with
// * it. Every entry is measured whether or not the theme declares its `on-` token, so the ones
// * left to Vuetify's own pick are guarded rather than trusted.
const FILL_ROLES = [
  'primary',
  'secondary',
  'accent',
  'error',
  'warning',
  'info',
  'success'
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

  // ! The success fill is the one role where the two faces need opposite content, and the case that
  // ! exposed the whole bug: a single forced `on-success: #ffffff` used to serve both, which the
  // ! light face reaches on its own anyway (5.28:1) but which put the dark face at 1.37:1. Only the
  // ! dark half is declared now; the light half is Vuetify's own pick, and asserting both here says
  // ! the two must stay opposite however each is arrived at. Legibility itself is the ratio test.
  it('lands opposite content on the two success fills', () => {
    const themes = install().theme.computedThemes.value;

    expect(hexOf(themes.light!.colors['on-success'])).toBe('#ffffff');
    expect(hexOf(themes.dark!.colors['on-success'])).toBe('#000000');
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

    // ! The other axis, and the one Vuetify cannot be left to decide: what lands ON a filled
    // ! accent. Its pick is biased to white (`whiteContrast > Math.min(blackContrast, 50)`, APCA)
    // ! with no threshold to configure, which on the dark pastels put the app bar's own title at
    // ! 2.41:1. Reading `on-<role>` off the computed theme covers both the roles the theme
    // ! overrides and the roles it leaves to that pick, so removing an override fails here.
    it.each(FILL_ROLES)('keeps content legible on a `%s` fill', (role) => {
      const theme = install().theme.computedThemes.value[name]!;
      const fill = hexOf(theme.colors[role]);
      const content = hexOf(theme.colors[`on-${role}`]);
      const ratio = contrastRatio(content, fill);

      expect(
        ratio,
        `${content} on ${role} ${fill} is ${ratio.toFixed(2)}:1`
      ).toBeGreaterThanOrEqual(4.5);
    });
  });
});
