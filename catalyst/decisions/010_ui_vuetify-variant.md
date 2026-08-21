# Decision: Vuetify as this branch's UI layer

## Status

Implemented

## Type

ui

## Task Weight

Medium

## Context

Recorded at the B4 variant sync (2026-08-02); the choice itself dates to **2024-08-02**, when this branch was created to carry a component-library variant of the master app (`144f17c` installs, `4c902d4` base setup, `6505015` Dracula themes), and was modernized on **2026-07-27**: Vuetify 4 (`2be6e3d`), Material Design Icons switched from webfont to SVG paths (`2e3d033`), styles moved to the Nuxt `css` array (`09b1be2`). Master's init design (ADR 001) fixed `frontend/ui = headless` and explicitly deferred the Vuetify record to this branch.

## Decision

**`frontend/ui = vuetify` on `variant/vuetify`.** The bundle's ui choice switched in the same sync: the three vuetify documents (`catalyst/stacks/frontend/nuxt/ui/vuetify/`) replaced `headless.md`, the `vuetify-setup`/`vuetify-components` skill wrappers were added in generator format, and the Technical Stack row flipped. The wiring matches the module's setup document as verified claim-by-claim during B4: `vite-plugin-vuetify` + Nuxt plugin (no Nuxt module), `@mdi/js` SVG icons, theme as the single colour source.

There is no rejected alternative to name — master _is_ the headless alternative; the branches exist to keep both.

## Variant-only specifics

Product decisions of this branch, not module prescriptions (the module's components document says exactly this about borrowing compositions):

- **Auth lives in dialogs, not routes.** `LoginDialog`/`RegisterDialog`/`ForgotPasswordDialog` mount in `layouts/Default.vue`, one `useMutationDialog()` call each; the four auth pages are deleted. Follow-on: `utils/authRedirectLogic.ts` shrinks guest-only routes to `['/password-reset']` and redirects unauthenticated users to `/home`, and the flattened `pages/password-reset.vue` reads `?token=&email=` — the backend's emailed reset URL must match, so this composition reaches into route policy and server config (why it is recorded here).
- **Dracula palette with custom theme tokens.** `link`, `highlight`, and `foreground` beyond Vuetify's built-ins, used as ordinary `color=` props and `--v-theme-*` variables; no `surface` override.
- **Project idioms:** `GapContainer` (polymorphic `d-flex`/gap wrapper; imports `VSheet`/`VCard` explicitly for `<component :is>`), `PasswordField`'s second `visible` model shared across a password/confirmation pair, `UserCard`'s inline edit mode owning its own update, so the page renders `<UserCard />` bare.

## Known inconsistencies (recorded, not fixed)

- `CookieConsentBanner.vue` is hand-rolled HTML/CSS with hardcoded colours that ignore the theme (arrived from master unconverted).
- `LoginDialog.vue` ships hardcoded dev credentials in `initialForm`.
- `useThemeSwitching()` is declared inside `layouts/Default.vue` rather than in `composables/`. It is pure logic — cookie-backed theme persistence — so it is testable the moment it moves, and untestable where it is. Extracting it is deferred with the rest of the component work, not blocked by it. (`useUserDialogs()` sat beside it and is gone: the three auth dialogs are now one `useMutationDialog()` call each.)

## Scope

`catalyst/` bundle (ui docs, Technical Stack row), `.claude/skills/`, `web/CLAUDE.md`. No behavior contracts change; the session/auth contract stays owned by `features/001_session-auth.md`.

## Consequences

- The bundle now advertises the vuetify skills and governs the code that actually exists here; future `upgrade_project.py` runs refresh the vuetify documents (presence-detected) and regenerate the wrappers.
- Master → variant merges stay conflict-free on the _stack documents_: the two ui choices live at different paths, and this branch deletes rather than edits `headless.md`. They are **not** conflict-free on the code — the 2026-08-17 sync took 21 conflicts across pages, layouts, `_shared/` components and the shared documents. Branch sync below is the standing resolution.
- The auth-in-dialogs composition means master's auth-page changes need manual porting judgement at each sync rather than a clean merge.

## Branch sync

Master is the source; this branch is a **variant** (`context/domain-glossary.md`) — synced from master, never merged back. What syncs is decided by path, not by reading each diff:

| Path                                                                        | Resolution                                                                                                                          |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `web/composables/`, `web/services/`, `web/utils/`, `catalyst/stacks/`       | **Master wins.** Framework-agnostic; this is the layer the sync exists to carry.                                                    |
| `web/pages/`, `web/layouts/`, `web/components/`, `web/assets/`, `web/i18n/` | **Variant wins**, always, including a file this branch has deleted (the four auth pages — auth lives in the layout's dialogs here). |
| `web/CLAUDE.md`, `catalyst/operations.md`, `catalyst/features/*`            | **By hand.** Both branches hold real content, and these describe both.                                                              |

Two things this does not catch on its own:

- **Master-only UI files arrive as clean additions**, not conflicts — git has nothing on this branch to compare them against. They are deleted in the merge commit (the 2026-08-17 sync deleted 14: the `UI*`/`AuthCard`/badge primitives, `ProfileFormDialog`, `UserGqlFormDialog` and their specs). Left in, they would be unreferenced components styled against master's tokens, with specs that run and pad this branch's coverage and mutation figures. Every later master commit touching one of those paths raises a modify/delete conflict, resolved as _delete_ each time — that friction is the signal, not a defect.
- **A shared document can auto-merge into a lie.** `features/002` and `007` took master's entry-point edits cleanly in the 2026-08-17 sync and pointed this branch at components it does not have. Read every `catalyst/features/*` diff after the merge, conflicted or not.

A change genuinely wanted in both UI layers is ported deliberately, as its own commit on each branch. It is never a merge resolution.

## Verification

B4 claim-by-claim pass (2026-08-02): every wiring, dependency, icon, dialog-base, form, and layout claim in the vuetify documents checked against this branch's code — two upstream doc corrections came out of it and are mirrored here (`theme.global.current` + `theme.toggle()`, custom-token paragraph). Skill wrappers diffed byte-identical against `write_skill_wrappers()` output; `validate.py` green; post-sync suites green (Pest 35, Vitest 12, oxlint, oxfmt, typecheck).

2026-08-13: `web/plugins/_tests/vuetify.spec.ts` pins the two wiring claims that fail silently — the locale adapter reading through `{ global: app.$i18n }` (handing it the Composer directly leaves Vuetify's own strings unresolved) and the forced white on success surfaces. The colour assertion runs against `theme.computedThemes`, not the declared themes: removing the override does not leave a hole, it yields black. Both were confirmed by sabotage before being recorded.

2026-08-17: first sync run under Branch sync above. 21 conflicts resolved by the table, 14 master-only UI files deleted, `features/002` and `007` corrected after auto-merging into claims untrue here. Post-merge suites green (Vitest 51 files / 434 tests, oxlint, typecheck, `validate.py`).

2026-08-21: second sync run under Branch sync, plus the height-cap parity port. Ten conflicts resolved by the table; two things it does not catch were caught by reading the result — `nuxt.config.ts` auto-merged into a duplicate `spaLoadingTemplate` key, and `renovate.json` corrected this branch's own icon rule from `@mdi/font` to `@mdi/js`, a package `package.json` shows the branch does not carry. The measured cap (`useElementBounding`) is retired branch-wide for a `min-height: 0` flex chain, and `UserCard` now scrolls its fields; both walked live — the tables scroll under pinned headers with the page itself unscrollable, the card shrinks and scrolls in edit mode while its header controls stay put, and both re-adapt to a shrunken viewport without measuring. Suites green (Vitest 51 files / 434 tests, oxlint, oxfmt, typecheck, `validate.py`).

## Contracts Touched

- `project-summary.md` — Technical Stack row (`frontend/ui | vuetify`), ADR Index row for this record.
- `web/CLAUDE.md` — layouts, pages, plugins, and the ui governing-document pointer.

## Open Questions

(none)
