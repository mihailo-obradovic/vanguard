# Vuetify Setup

**Layer:** Frontend / UI
**Tool:** Vuetify 4 · vite-plugin-vuetify · @mdi/js

Vuetify is wired as a **Vite plugin plus a Nuxt plugin**, not as a Nuxt module. There is no `@nuxtjs/vuetify` entry in the `modules` array — a common wrong turn when following older guides.

## Dependencies

| Package               | Where           | Why                                                                 |
| --------------------- | --------------- | ------------------------------------------------------------------- |
| `vuetify`             | dependencies    | The library                                                         |
| `@mdi/js`             | dependencies    | Icon paths as SVG data, tree-shaken per icon                        |
| `vite-plugin-vuetify` | devDependencies | Component auto-import and styles treeshaking                        |
| `sass`                | devDependencies | Only if SFCs use `lang="scss"` — Vuetify itself does not require it |

Adding these is a Dependency Change: it needs the user's approval and an `architecture.md` update in the same change.

## Nuxt config

Four edits, all of them load-bearing:

```ts
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';

export default defineNuxtConfig({
  build: { transpile: ['vuetify'] },

  vite: {
    vue: { template: { transformAssetUrls } },
    plugins: [vuetify({ autoImport: true })]
  },

  css: ['vuetify/styles', '@/assets/styles/main.css']
});
```

- **`build.transpile`** — Vuetify ships untranspiled ESM; without this the build fails on syntax it will not process.
- **`transformAssetUrls`** — lets Vuetify components resolve asset URLs in their templates. Omitting it produces images that work in dev and 404 in production.
- **`vuetify({ autoImport: true })`** — the plugin that makes `<v-*>` usable without imports and drops the styles of components the app never uses. Without `autoImport`, every component must be imported by hand _and_ the full stylesheet ships.
- **`'vuetify/styles'` first in `css`** — the project's own stylesheet comes after so it can override, not the reverse.

## The plugin file

`@/plugins/vuetify.ts` creates the instance and installs it. Two things belong here and nowhere else — the icon set and the theme:

```ts
import { createVuetify } from 'vuetify';
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg';

// Light and dark share every colour but the surface pair, so the palette is
// declared once and spread into both.
const baseColors = {
  primary: '#…',
  secondary: '#…',
  error: '#…',
  warning: '#…',
  info: '#…',
  success: '#…'
};

export default defineNuxtPlugin((app) => {
  app.vueApp.use(
    createVuetify({
      icons: { defaultSet: 'mdi', aliases, sets: { mdi } },
      theme: {
        defaultTheme: 'light',
        themes: {
          light: {
            dark: false,
            colors: { background: '#…', surface: '#…', ...baseColors }
          },
          dark: {
            dark: true,
            colors: { background: '#…', surface: '#…', ...baseColors }
          }
        }
      }
    })
  );
});
```

The colour values above are placeholders — the project's design tokens go here, and this file becomes the single source for them. A component hardcoding a hex value has bypassed the theme.

## Icons: SVG, not the icon font

`mdi-svg` means icons are **imported as path data** and tree-shaken, rather than a webfont that ships all six thousand of them:

```ts
import { mdiClose, mdiContentSave } from '@mdi/js';
```

```vue
<v-btn :icon="mdiClose" />
```

The trade is that a string icon name (`icon="mdi-close"`) will silently render nothing. If an icon is missing, this is almost always why.

## Auto-import semantics

`autoImport: true` covers **templates only**:

- In a template, `<v-card>` needs no import.
- Referencing a component **programmatically** — a `computed` returning a component, a dynamic `<component :is>` — still needs an explicit import: `import { VSheet, VCard } from 'vuetify/components'`.
- Composables are always explicit: `import { useTheme } from 'vuetify'`.

## Verifying the wiring

The four config edits fail in distinct ways, which makes them quick to tell apart: a build error on Vuetify's own syntax means `transpile`; unstyled components mean `css`; an unknown-component warning means the Vite plugin; a blank icon means the SVG iconset.
