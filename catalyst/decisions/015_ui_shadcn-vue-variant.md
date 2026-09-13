# Decision: shadcn-vue as this branch's UI layer

## Status

Implemented

## Type

ui

## Task Weight

Medium

## Context

Recorded at the close of the conversion. `variant/shadcn-vue` was branched from master to carry a fourth UI face of the same app, beside `variant/vuetify` (record 010) and `variant/nuxtui` (014 on that branch). Master's init design (ADR 001) fixed `frontend/ui = headless` and left each variant to record its own choice. The auth composition was decided mid-conversion in `decisions/014_ui_shadcn-dialog-auth-composition.md` and is not repeated here.

## Decision

**`frontend/ui = shadcn-vue` on `variant/shadcn-vue`**: vendored registry source (new-york) on Reka UI, Tailwind CSS 4 and Lucide. The bundle carries the module ahead of the Catalyst template, in `stacks/frontend/nuxt/ui/shadcn-vue/`. `headless.md` is deleted and the Technical Stack row flipped. No generated wrappers point at the module yet; they arrive with the template port.

No rejected alternative to name — master _is_ the headless one; the branches exist to keep all four.

## Variant-only specifics

Product decisions of this branch, not module prescriptions:

- **Optimal shadcn-vue code over parity** with the other variants (`shadcn-vue.md`, Optimal beats parity). A composition that diverges needs no justification; diverging from the module's idioms does.
- **Forms compose `ui/field` directly, with no wrapper.** `useFieldAria` supplies the `id`/ARIA pairing `ui/field` lacks. `useConfirmOnEnter` is kept for Enter-to-confirm in dialogs.
- **Toasts are `vue-sonner` behind the `$toast` seam**, which master now shares; only the mounted `Toaster` differs.
- **Dracula on shadcn's semantic tokens**, sourced from `variant/nuxtui`'s measured palette, with one deviation. Dark `--muted-foreground` is `#bac0d0`, because shadcn sets muted text on the muted fill. The product needs three roles shadcn has no name for: `--success`, `--warning` and `--scroll-edge`, each declared in both faces with contrast measured.
- **Colour mode is `@nuxtjs/color-mode` with preference `light`**, not `system`. The Sun/Moon `aria-pressed` toggle offers no way back to following the OS, and `main.css` sets `color-scheme` per face.
- **Below `lg` the navbar's links and auth controls move into a vendored `Sheet` drawer.** The breakpoint is `lg`, not `md`, because the signed-in admin bar needs 732–779px. Focus returns through `useFocusReturn`: Reka restores to a detached opener as a no-op, so the layout names the control that started a dialog chain and `#main-content` is the fallback.
- **A destructive confirmation's confirm is a plain `Button`.** `AlertDialogAction` is Reka's `DialogClose` and closes before its click listener runs.
- **Tables scroll in a plain `overflow-auto` region**, not `UIScrollArea`. The bordered shell and the header band already mark the edges.
- **Row actions are icon-only, with per-row labels**, and the bar, drawer and button actions carry icons as on the other variants. Error page: `features/011_error-page.md`.
- **`shadcn-nuxt` is not installed.** Vendored components are imported explicitly and `components.dirs` registers only `_shared/`, so none of the auto-import warnings it exists to silence arise.

## Vendored deviations

Each deviation is annotated in its file and is what the runbook's upstream check reads against:

- `FieldError` always renders, with two lines of reserved height, and carries lint braces.
- `CardTitle` takes `as`.
- `DialogContent`, `DialogScrollContent`, `AlertDialogContent` and `SheetContent` paint `bg-popover`, not `bg-background`; `SheetContent` also translates its close label.
- `Table`'s container drops `overflow-auto`.
- `Button` and `SelectTrigger` gain `on-primary`, and `SelectTrigger`'s variant also overrides the base's `dark:bg-input` fills, which fell to 4.13:1 / 3.18:1 on the lavender bar.
- `Badge` gains `success` and `warning`.

## Scope

`catalyst/` bundle (ui module documents, Technical Stack row, `validation.md`'s presenter reference), `architecture.md` (approved dependencies), `operations.md`, `conventions/branch-sync.md`, `stryker.config.json`, `web/CLAUDE.md`. No behavior contract changes beyond what features 001, 003, 009 (via record 014) and 011 own.

## Consequences

- Master → variant syncs stay clean on the stack documents, since this branch deletes rather than edits `headless.md`, but not on the code, where the UI is a rewrite. `conventions/branch-sync.md` is the standing procedure; its third blind spot, a bundle document master does not carry, applies to the whole `shadcn-vue/` module.
- Renovate cannot see vendored files. Their upstream changes arrive only through the runbook's check, and `shadcn-vue diff` cannot be that check in 2.8.2 (`operations.md`, Vendored shadcn-vue components).
- Vendored `web/components/ui/` is outside the mutation run, so the score is a statement about this project's own scripts.
- Follow-ups: the module's port into the Catalyst template, and master's audit of the shared-util survivors this run surfaced (Workflowy).

## Contracts Touched

- `project-summary.md` — Technical Stack row, ADR Index row.
- `architecture.md` — approved-dependency rows (`shadcn-nuxt` removed, `vue-sonner` and `@lucide/vue` corrected).
- `stacks/frontend/nuxt/validation.md` — the field-error presenter reference.
- `stacks/frontend/nuxt/ui/shadcn-vue/setup.md` — the upstream check's pointer.
- `operations.md` — mutation figures and triage, the test register, the vendored-components check and CLI traps.
- `conventions/branch-sync.md` — `headless.md` joins the variant-wins paths.
- `web/CLAUDE.md` — the ui governing-document pointer.

## Open Questions

(none)

## Verification

- **Suites green on the branch**: Vitest 55 files / 469 tests, Pest 122 tests, `oxlint`, `oxfmt`, `nuxt typecheck`, `validate.py` 0 errors.
- **Mutation**: 89.54% total, 91.39% on covered code, over 1,090 scored mutants. Every survivor was either killed by a test proven against its mutant by hand, or recorded with its reason in `operations.md`.
- **Coverage**: 77.68% statements / 79.40% lines.
- **Walked live** in Chromium on both faces, measuring contrast at rest and on hover:
  - the navbar and drawer at 390px and at desktop width;
  - every auth dialog and hand-off, with focus after each close;
  - the users and GraphQL tables at 320, 390 and 768px;
  - a real delete;
  - the error page.
- **Upstream check** run once under the runbook's procedure on `field`, `label` and `separator`: the only difference from upstream is the annotated `FieldError` deviation.
