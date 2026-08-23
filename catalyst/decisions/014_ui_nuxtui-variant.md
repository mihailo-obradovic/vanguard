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
- **Dracula on the seven semantic aliases.** Custom `@theme static` colours in `main.css`. Each accent carries two shades: 400, Dracula's own pastel, for the dark face, and for the light face the darkest step of that hue still clearing 4.5:1 under white — primary 700 `#8144c5` (5.89:1), secondary 700 `#bf0086` (5.90), success 800 `#007d2f` (5.28), info 800 `#007687` (5.33), warning 800 `#8c5400` (6.21), error 600 `#db0026` (5.20). One shared shade is not available: all six at 700 drops success to 3.69, info to 3.74, warning to 4.46. The `dracula` neutral ramp keeps all eleven — the only ramp the bg, text and border tokens consume; `neutral` would shadow Tailwind's own palette. Its 200 and 300 are hand-damped toward neutral, being the greys that show against the cream canvas; the rest interpolate in OKLab.
- **The other nine steps of each accent ramp are gone** (66 lines of `@theme` for 12). Nuxt UI's components never name an accent shade — they read `--ui-<accent>` and alpha-derive every variant — and neither the library nor this app uses one. The dropped steps' `--ui-color-<accent>-<shade>` are still declared and now resolve empty, so a stray `bg-primary-100` does nothing rather than painting wrong.
- **The dark block's accents are load-bearing** despite matching Nuxt UI's defaults: the light block matches `<html>` in both faces and is declared after Nuxt UI's `.dark`, so deleting them paints dark mode in the light face's accents. Measured by deletion — as was retiring the old `:root.dark` selector, which a bare `.dark` replaces on source order.
- **A cream page canvas under white surfaces.** The light face paints the page in Dracula's own foreground `#f8f8f2` and the surfaces white above it, restoring Nuxt UI's ladder — emphasis darkens — which the previous cool-grey canvas had inverted. The canvas stays this project's own `--app-bg-page`: Nuxt UI names only the surface, and `--ui-bg` is what a card, table, modal or input paints with, 73 times across the library and the vendored configs (`context/domain-glossary.md`, Page canvas). The `body` override is the cost of that gap.
- **Per-component vendored theme configs** in `web/config/nuxt-ui/`, holding upstream's complete default theme with every deviation annotated (`customization.md`). Tailwind class sorting is exempted there for exactly that reason.
- **`@iconify-json/lucide` bundled locally** so Nuxt UI's own icon names — the `:loading` spinner included — resolve without an Iconify HTTP call.
- **The boot splash needs no cookie script**, unlike vuetify's: `@nuxtjs/color-mode` stamps `dark` on `<html>` from a synchronous head script before the body paints, so plain CSS picks the face.
- **No native `<select>` survives.** `USelect` is a Reka listbox jsdom cannot drive; specs drive it through `update:modelValue` at the component seam, which is the right seam regardless.

## Known inconsistencies (recorded, not fixed)

- `LoginDialog.vue` ships prefilled dev credentials. Deliberate, and kept.
- Nine Markdown documents fail `oxfmt --check`, all nine master-owned — each one fails on `master` too. Pre-existing; left for a master-side pass.

## Scope

`catalyst/` bundle (ui module documents, Technical Stack row, `validation.md`'s presenter cross-reference), `.claude/skills/`, `.oxfmtrc.json`, `web/CLAUDE.md`. No behavior contract changes: session and auth stay owned by `features/001_session-auth.md`.

## Consequences

- Master → variant merges stay clean on the _stack documents_ — the three ui choices live at different paths and this branch deletes rather than edits `headless.md` — but not on the code, where this branch's UI is a rewrite rather than a variation. Branch sync below is the standing resolution.
- The port (Catalyst 1.7.0) made the wrappers generated rather than hand-kept and turned the branch-only AI tooling into module prescriptions: the scaffolder writes the MCP server entry, and the `nuxt-ui` skill is a prescribed day-zero vendor from `github.com/nuxt/ui` with the pin recorded in `stacks/frontend/nuxt/ui/nuxtui/nuxtui.md`.

## Branch sync

Master is the source; this branch is a **variant** (`context/domain-glossary.md`) — synced from master, never merged back. What syncs is decided by path, not by reading each diff:

| Path                                                                                                                                | Resolution                                                                                                                                                |
| ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `web/composables/`, `web/services/`, `web/utils/`, `catalyst/stacks/`                                                               | **Master wins.** Framework-agnostic; this is the layer the sync exists to carry.                                                                          |
| `web/pages/`, `web/layouts/`, `web/components/`, `web/assets/`, `web/config/nuxt-ui/`, `web/i18n/`, `web/spa-loading-template.html` | **Variant wins**, always, including a file this branch has deleted (`login`, `register` and `forgot-password` — auth lives in the layout's dialogs here). |
| `web/CLAUDE.md`, `catalyst/operations.md`, `catalyst/features/*`                                                                    | **By hand.** Both branches hold real content, and these describe both.                                                                                    |

Two things the table does not catch on its own:

- **Master-only UI files arrive as clean additions**, not conflicts — git has nothing on this branch to compare them against. They are deleted in the merge commit. Left in, they would be unreferenced components styled against master's tokens, with specs that run and pad this branch's coverage and mutation figures. Every later master commit touching one raises a modify/delete conflict, resolved as _delete_ each time — that friction is the signal, not a defect.
- **A shared document can auto-merge into a lie**, pointing this branch at components it does not have. Read every `catalyst/features/*` and `catalyst/operations.md` diff after the merge, conflicted or not.

A change genuinely wanted in more than one UI layer is ported deliberately, as its own commit on each branch. It is never a merge resolution.

## Contracts Touched

- `project-summary.md` — Technical Stack row (`frontend/ui | nuxtui`), ADR Index row for this record.
- `web/CLAUDE.md` — the ui governing-document pointer and the form-field invariant.
- `stacks/frontend/nuxt/ui/nuxtui/customization.md` — the class-sorting exemption.
- `stacks/frontend/nuxt/validation.md` — the field-error presenter reference, which named the deleted `headless.md`.

## Open Questions

(none)

## Verification

Suites green on the branch at close-out: Vitest 44 files / 325 tests, `oxlint`, `nuxt typecheck`, `validate.py` 0 errors. The Tailwind-sorting change reformatted eight Vue files and no vendored config, and the suites were re-run green after it.

Mutation run 2026-08-21, after the survivor triage: **76.61% total, 88.86% covered** over 885 scored mutants — 678 killed, 85 survived, 122 without coverage, plus 51 ignored inside the compiler-macro disable pairs. The triage added fourteen tests across the dialogs, `UFormField` and `emailRules`, each verified by breaking its target in the source; the survivors it accepted are recorded with their evidence in `operations.md`. The no-coverage rise over the pre-triage run is unexplained and flagged there.

2026-08-23: first sync run under Branch sync above. Nine conflicts resolved by the table; the two things it does not catch were checked by reading the result rather than the conflict list — no master-only UI file arrived as a clean addition, and `nuxt.config.ts` did not repeat vuetify's duplicate `spaLoadingTemplate` key. Master's `nameRules` extraction and table height cap were already here, reached independently through Tailwind rather than master's hand-rolled CSS, so the merge's net effect is three files: the Renovate rule for this branch's own deps, the glossary's table-height-cap term, and one `operations.md` correction. Suites green (Vitest 45 files / 343 tests, `oxlint`, `nuxt typecheck`, `validate.py`).
