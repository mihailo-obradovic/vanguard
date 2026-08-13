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

- **Auth lives in dialogs, not routes.** `LoginDialog`/`RegisterDialog`/`ForgotPasswordDialog` mount in `layouts/Default.vue` driven by a local `useUserDialogs()` composable; the four auth pages are deleted. Follow-on: `utils/authRedirectLogic.ts` shrinks guest-only routes to `['/password-reset']` and redirects unauthenticated users to `/home`, and the flattened `pages/password-reset.vue` reads `?token=&email=` — the backend's emailed reset URL must match, so this composition reaches into route policy and server config (why it is recorded here).
- **Dracula palette with custom theme tokens.** `link`, `highlight`, and `foreground` beyond Vuetify's built-ins, used as ordinary `color=` props and `--v-theme-*` variables; no `surface` override.
- **Project idioms:** `GapContainer` (polymorphic `d-flex`/gap wrapper; imports `VSheet`/`VCard` explicitly for `<component :is>`), `PasswordField`'s second `visible` model shared across a password/confirmation pair, `UserCard`'s inline edit mode via `defineExpose({ resetForm })`.

## Known inconsistencies (recorded, not fixed)

- `CookieConsentBanner.vue` is hand-rolled HTML/CSS with hardcoded colours that ignore the theme (arrived from master unconverted).
- `LoginDialog.vue` ships hardcoded dev credentials in `initialForm`.
- `FullScreenDialog.vue` is referenced by no page.

## Scope

`catalyst/` bundle (ui docs, Technical Stack row), `.claude/skills/`, `web/CLAUDE.md`. No behavior contracts change; the session/auth contract stays owned by `features/001_session-auth.md`.

## Consequences

- The bundle now advertises the vuetify skills and governs the code that actually exists here; future `upgrade_project.py` runs refresh the vuetify documents (presence-detected) and regenerate the wrappers.
- Master → variant merges stay conflict-free on the ui layer: the two choices live at different paths, and this branch deletes rather than edits `headless.md`.
- The auth-in-dialogs composition means master's auth-page changes need manual porting judgement at each sync rather than a clean merge.

## Verification

B4 claim-by-claim pass (2026-08-02): every wiring, dependency, icon, dialog-base, form, and layout claim in the vuetify documents checked against this branch's code — two upstream doc corrections came out of it and are mirrored here (`theme.global.current` + `theme.toggle()`, custom-token paragraph). Skill wrappers diffed byte-identical against `write_skill_wrappers()` output; `validate.py` green; post-sync suites green (Pest 35, Vitest 12, oxlint, oxfmt, typecheck).

## Contracts Touched

- `project-summary.md` — Technical Stack row (`frontend/ui | vuetify`), ADR Index row for this record.
- `web/CLAUDE.md` — layouts, pages, plugins, and the ui governing-document pointer.

## Open Questions

(none)
