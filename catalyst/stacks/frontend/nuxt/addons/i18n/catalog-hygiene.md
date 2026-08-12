# Message Catalog Hygiene

**Category:** i18n
**Tool:** @nuxtjs/i18n

The locale catalog files — one per locale in the project's `<locales>` set — are the source of truth for all user-facing display strings. Whenever a key is added, renamed, or removed, apply the change to **all locale files in the same edit**.

## Rules

1. **Identical structure.** Every key present in one catalog must exist in every other — same nesting, same key names. A **parity test** enforces this, failing on any orphan key in any locale; the project writes it once at adoption and runs it after every catalog edit.
2. **Alphabetical order at every nesting level**, and the **same order across all locale files** so they stay diffable. Reorder keys only — never touch values or placeholders while sorting.
3. **Translate correctly and consistently per locale.** Each locale gets a genuine translation, not a copy of another locale's text. Register, script, and transliteration decisions (formal vs informal address, dialect, script variants) are recorded per project — in `project-summary.md` or a convention annex — and applied consistently across the whole catalog. Where two locales in the set are script variants of one language (Latin and Cyrillic Serbian, say), one is authored and the other transliterated; the parity test checks the transliteration, and the words exempt from it (brand names, addresses, technical tokens) are listed in one place.
4. **Preserve interpolation exactly.** Named placeholders (`{name}`, `{count}`) and any ICU-style blocks must be identical in structure across all locales — only the human-readable text differs.
5. **Plurals follow the locale's own plural system.** Vue I18n's default pluralization is index-based and English-shaped (two branches). A locale with a different system needs a `pluralRules` entry in `i18n.config.ts` and the matching number of `|`-separated branches in **every** pluralized key — Serbian's one/few/other is three, not two.

## Placement

- Reusable, context-free words and phrases (Save, Close, Cancel, Loading…) → the **`common`** namespace, defined once and reused. Don't duplicate the same phrase across namespaces.
- Page- or feature-specific copy → that feature's namespace. Create a new top-level namespace when a feature has several strings and none fits an existing one.
- Where a project ships UI-library variants over one backend, the variants share one catalog vocabulary: a key whose copy is identical in both is defined once under the same name, and variant-only surfaces add keys rather than forking existing ones.

## Reaching the catalog outside a component

`$t` and `useI18n()` need a component or a Nuxt context. In a plain `.ts` helper, take the translator from `useNuxtApp().$i18n` **inside the function**, never at module scope — at import time the Nuxt app doesn't exist yet, and a module-scope call breaks the build. A helper whose messages are declared up front (validation rule builders, for instance) takes lazy message functions so the lookup happens at render, and re-renders correctly when the locale changes.

## Typed keys

Key types come from the primary locale's catalog through the module's generated types; after adding keys, run the project's typecheck to verify call sites.
