# Stack: Frontend UI — Vuetify

**Layer:** Frontend / UI
**Tool:** Vuetify 4 · Material Design Icons (SVG)

The Material Design component library for the Nuxt module. A broad, batteries-included suite: inputs with built-in validation display, dialogs with focus management, a layout system, and a theme with light and dark variants out of the box.

- Components are used **kebab-case** in templates (`<v-btn>`, `<v-text-field>`), per the tag-casing rule in `../../../_vue/vue-style.md`. Project components stay PascalCase, so the two are distinguishable at a glance.
- **Vuetify's utility classes** (`d-flex`, `ga-4`, `pa-4`, `text-body-2`) are the project's utility system — they satisfy the style guide's "prefer utilities over custom CSS" rule in place of Tailwind.
- The theme owns colour. Components reference theme colours by name (`color="primary"`); hardcoded hex values in component styles are a smell.
- Vuetify inputs take an `:error-messages` prop that accepts a `string[]` — which is exactly the shape Regle's `$errors` produces, so validation wires up with no adapter (`../../validation.md`).

## Module Documents

| Document                         | Load                                                                                                                               |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| [`setup.md`](setup.md)           | Configuration and wiring — when installing Vuetify, changing the theme or iconset, or debugging why a component or icon is missing |
| [`components.md`](components.md) | Composition patterns — when building dialogs, layouts, or forms, or deciding whether to add a shared primitive                     |

## Avoid By Default

- Wrapping every Vuetify component in a project component "for consistency". Wrap only where the project adds real behaviour or a genuinely repeated composition (`components.md`).
- Overriding Vuetify internals with deep selectors (`:deep(.v-field__input)`). Reach for props, slots, and theme configuration first; a deep override breaks on a minor version bump.
- Mixing a second component library alongside it.
