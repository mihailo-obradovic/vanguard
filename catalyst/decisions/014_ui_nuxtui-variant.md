# Decision: Nuxt UI as this branch's UI layer

## Status

Implemented

## Type

ui

## Task Weight

Medium

## Context

Recorded at the close of the variant build (2026-08-19). `variant/nuxtui` was branched from master to carry a third UI face of the same app, beside `variant/vuetify` (record 010). Master's init design (ADR 001) fixed `frontend/ui = headless` and left each variant to record its own choice here.

## Decision

**`frontend/ui = nuxtui` on `variant/nuxtui`.** The bundle's ui choice switched with it: `stacks/frontend/nuxt/ui/nuxtui/` (`nuxtui.md`, `customization.md`) replaced `headless.md`, the `nuxtui-setup` / `nuxtui-customization` wrappers were added, and the Technical Stack row flipped.

The module was ported upstream in Catalyst 1.7.0 (a third `nuxt` UI choice beside headless and vuetify), and this project upgraded to that release: the wrappers are now generator-owned — `nuxtui-setup`, `nuxtui-customization`, and `import-nuxt-ui-component` all refresh on upgrade — and the bundle's two module documents track the template's, with this repo's deviations (the `web/` srcDir paths, the `UI`-prefix naming note, the standing `UFormField` example, and the recorded vendor pin) re-applied on top.

No rejected alternative to name — master _is_ the headless one, vuetify the other library; the branches exist to keep all three.

## Variant-only specifics

Product decisions of this branch, not module prescriptions:

- **Dialogs own their own mutations.** Auth and user dialogs are `<u-modal>`s opened through Nuxt UI's `useOverlay`; each owns its mutation, its 422s, its success toast, and resolves with what it saved. This is the sharpest divergence from vuetify, where the layout holds `useMutationDialog()` and the dialogs are dumb `v-model`/`:loading`/`@confirm` children. Vuetify has no `useOverlay` equivalent — the split is a library capability difference, not a disagreement.
- **Dracula on the seven semantic aliases.** Custom `@theme` ramps in `main.css`, each accent at shade 400 so dark mode is true Dracula; light mode darkens them to reach 4.5:1. The neutral ramp is named `dracula` — `neutral` would shadow Tailwind's own palette.
- **Per-component vendored theme configs** in `web/config/nuxt-ui/`, holding upstream's complete default theme with every deviation annotated (`customization.md`). Tailwind class sorting is exempted there for exactly that reason.
- **`@iconify-json/lucide` bundled locally** so Nuxt UI's own icon names — the `:loading` spinner included — resolve without an Iconify HTTP call.
- **The boot splash needs no cookie script**, unlike vuetify's: `@nuxtjs/color-mode` stamps `dark` on `<html>` from a synchronous head script before the body paints, so plain CSS picks the face.
- **No native `<select>` survives.** `USelect` is a Reka listbox jsdom cannot drive; specs drive it through `update:modelValue` at the component seam, which is the right seam regardless.

## Known inconsistencies (recorded, not fixed)

- `LoginDialog.vue` ships prefilled dev credentials. Deliberate, and kept.
- Ten Markdown documents fail `oxfmt --check`, eight master-owned. Pre-existing; left for a master-side pass.

## Scope

`catalyst/` bundle (ui module documents, Technical Stack row, `validation.md`'s presenter cross-reference), `.claude/skills/`, `.oxfmtrc.json`, `web/CLAUDE.md`. No behavior contract changes: session and auth stay owned by `features/001_session-auth.md`.

## Consequences

- Master → variant merges stay clean on the _stack documents_ — the three ui choices live at different paths and this branch deletes rather than edits `headless.md` — but not on the code, for the reasons record 010 sets out.
- The port (Catalyst 1.7.0) made the wrappers generated rather than hand-kept and turned the branch-only AI tooling into module prescriptions: the scaffolder writes the MCP server entry, and the `nuxt-ui` skill is a prescribed day-zero vendor from `github.com/nuxt/ui` with the pin recorded in `stacks/frontend/nuxt/ui/nuxtui/nuxtui.md`.

## Contracts Touched

- `project-summary.md` — Technical Stack row (`frontend/ui | nuxtui`), ADR Index row for this record.
- `web/CLAUDE.md` — the ui governing-document pointer and the form-field invariant.
- `stacks/frontend/nuxt/ui/nuxtui/customization.md` — the class-sorting exemption.
- `stacks/frontend/nuxt/validation.md` — the field-error presenter reference, which named the deleted `headless.md`.

## Open Questions

(none)

## Verification

Suites green on the branch at close-out: Vitest 44 files / 325 tests, `oxlint`, `nuxt typecheck`, `validate.py` 0 errors. The Tailwind-sorting change reformatted eight Vue files and no vendored config, and the suites were re-run green after it.

Mutation run 2026-08-21, with the compiler-macro disable pairs restoring the seven previously dropped specs (`catalyst/operations.md`): **78.19% total, 84.91% covered** over 885 scored mutants — 692 killed, 123 survived, 70 without coverage, plus 51 ignored inside the pairs. The no-coverage remainder is genuinely unexecuted code: `hide-devtools-webcomponents.client.ts`, `AuthControls.vue`, and a uniform handful of module-scope mutants per dialog that per-test coverage cannot attribute. The newly executed dialog mutants surface survivors not yet triaged — tracked as its own task per the ADR 013 audit rule. Services, stores and queries score 100%; `utils/` 94.90%.
