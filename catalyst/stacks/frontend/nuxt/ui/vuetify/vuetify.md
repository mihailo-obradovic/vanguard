# Stack: Frontend UI — Vuetify

**Layer:** Frontend / UI
**Tool:** Vuetify 4 · Material Design Icons (SVG)

The Material Design component library for the Nuxt module.

- Components are used **kebab-case** in templates (`<v-btn>`, `<v-text-field>`), per the tag-casing rule in `../../../_vue/vue-style.md`; project components stay PascalCase.
- **Vuetify's utility classes** (`d-flex`, `ga-4`, `pa-4`, `text-body-2`) are the project's utility system — they satisfy the style guide's "prefer utilities over custom CSS" rule in place of Tailwind.
- The theme owns colour. Components reference theme colours by name (`color="primary"`); hardcoded hex values in component styles are a smell.
- Vuetify inputs accept Regle's `$errors` directly — no adapter ([`components.md`](components.md), Forms).

## Module Documents

| Document                         | What it holds            | Load                                                                                                                       |
| -------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| [`setup.md`](setup.md)           | Configuration and wiring | When installing Vuetify, changing the theme or iconset, or debugging why a component or icon is missing                    |
| [`components.md`](components.md) | Composition patterns     | When building dialogs, layouts, or forms, sizing an element to the viewport, or deciding whether to add a shared primitive |

## Avoid By Default

- Wrapping every Vuetify component in a project component "for consistency". Wrap only where the project adds real behaviour or a genuinely repeated composition (`components.md`).
- Overriding Vuetify internals with deep selectors (`:deep(.v-field__input)`). Reach for props, slots, and theme configuration first; a deep override breaks on a minor version bump.
- Mixing a second component library alongside it.
