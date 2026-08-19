# Stack: Frontend UI — Nuxt UI

**Layer:** Frontend / UI
**Tool:** Nuxt UI 4 · Tailwind CSS 4 · Reka UI

Vue's first-party-adjacent component library for the Nuxt module, built on Reka UI for behaviour and Tailwind Variants for theming.

- Components are used **kebab-case** in templates (`<u-button>`, `<u-modal>`), per the tag-casing rule in `../../../_vue/vue-style.md`; project components stay PascalCase. Here that distinction earns its keep twice over: the project's own primitives are `UI`-prefixed, so `<UIField>` and Nuxt UI's `<u-field>` would otherwise differ by a single character.
- **Tailwind utility classes** are the project's utility system — Nuxt UI brings Tailwind CSS 4, so the style guide's "prefer utilities over custom CSS" rule is satisfied without a `<style scoped>` block in most components.
- **Colour comes from the seven semantic aliases** (`primary`, `secondary`, `success`, `info`, `warning`, `error`, `neutral`), never a palette name and never a hex. The ramps behind them, and the per-mode token set, live in the project's stylesheet.
- Nuxt UI **registers `@nuxt/icon`, `@nuxt/fonts` and `@nuxtjs/color-mode` itself** — none of them belongs in the `modules` array, and none needs a direct dependency entry. They are configured through root-level keys in `nuxt.config.ts`.

## Module Documents

| Document                               | What it holds                                    | Load                                                                                            |
| -------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| [`customization.md`](customization.md) | How a component's theme is overridden, and where | When changing what a component looks like, importing a component's defaults, or adding a colour |

## AI Tooling

This module expects two things the library publishes for agents, both branch-local to the variant that runs it:

- The **Nuxt UI MCP server** (`.mcp.json`, project scope) — the authority on component APIs: props, slots, events, and the default theme an import copies. Component API questions go there rather than to a bundle document, which is why no document here restates them.
- The **vendored `nuxt-ui` skill** (`.claude/skills/nuxt-ui/`) — upstream's own guidance on component selection, layouts, and recipes.

## Provenance

Vendored 2026-08-19 from Nuxt UI's own `nuxt-ui` agent skill. It lands at `.claude/skills/nuxt-ui/` rather than inside this bundle: upstream ships `SKILL.md` and its `references/` as one unit with relative links between them, so splitting the substance into the bundle would mean rewriting every internal link and maintaining that as a permanent deviation. The trade is recorded rather than hidden — Phase 7 revisits it when the module is ported to Catalyst.

The copy is oxfmt-canonical like every other document here, per the no-ignore-patterns rule in `../../../../_lang/typescript/toolchain.md`; a re-sync normalizes upstream through the same oxfmt before diffing, so formatting never reads as drift.

Upstream: https://github.com/nuxt/ui — `skills/nuxt-ui/` (branch `v4`) · commit: `14ac243804bc02c6c1226823d1da3092cfcc9df3` · synced: 2026-08-19

Local deviations from upstream:

| File       | Deviation                                                                                                                     |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `SKILL.md` | Note added above the intro: points at this Provenance section and subordinates upstream guidance to the `catalyst/` documents |

Re-sync: re-clone `skills/nuxt-ui/` at the branch tip, normalize it through oxfmt with this repo's config, diff against `.claude/skills/nuxt-ui/`, and apply upstream's changes while re-applying the deviation above. Update the `Upstream:` line's commit and date in the same change.

## Avoid By Default

- Restating a component's API — props, slots, events — in a bundle document. The MCP server is the source, and a copied API list is stale the next release.
- Wrapping every Nuxt UI component in a project component "for consistency". Wrap only where the project adds real behaviour or a genuinely repeated composition.
- Reaching past the theme with deep selectors into generated classes. Slot classes, variants, and the `class` prop are the supported surface.
- Adding `@nuxt/icon`, `@nuxt/fonts`, or `@nuxtjs/color-mode` to `modules` or to dependencies — Nuxt UI already owns them, and a duplicate registration is a silent double-install.
