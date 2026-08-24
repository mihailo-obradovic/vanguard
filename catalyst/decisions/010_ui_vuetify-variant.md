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
- **Dracula palette with custom theme tokens, split per face.** `link` and `foreground` beyond Vuetify's built-ins, used as ordinary `color=` props and `--v-theme-*` variables; no `surface` override. (`highlight` was a third, declared for palette parity and referenced nowhere; it is dropped rather than left as a token no component asks for.) The accents are **not** one shared set: Dracula is drawn for a dark ground, and `variant="text"` / `variant="outlined"` buttons paint their label with the colour itself, so a shared palette puts real text between 1.29:1 and 4.41:1 on the light page. The light face therefore takes the darkest shade of each hue that still clears 4.5:1 — the same values `variant/nuxtui` derived for its own light face — and the dark face keeps Dracula as published. `secondary` (current-line grey behind the drawer, the empty layout and the role chip) stays shared: it is fill-only, and it is the one fill Vuetify's own contrast pick gets right on both faces. Worst case of each accent as foreground, measured across the page and the surface of its own face (§14.1, `stacks/frontend/nuxt/design-system.md`):

  | Role      | Light     | Ratio  | Dark      | Ratio   |
  | --------- | --------- | ------ | --------- | ------- |
  | `primary` | `#8144c5` | 5.52:1 | `#bd93f9` | 5.90:1  |
  | `accent`  | `#bf0086` | 5.53:1 | `#ff79c6` | 5.97:1  |
  | `error`   | `#db0026` | 4.88:1 | `#ff5555` | 4.53:1  |
  | `warning` | `#8c5400` | 5.82:1 | `#ffb86c` | 8.36:1  |
  | `info`    | `#007687` | 5.00:1 | `#8be9fd` | 10.29:1 |
  | `success` | `#007d2f` | 4.96:1 | `#50fa7b` | 10.38:1 |
  | `link`    | `#57638a` | 5.54:1 | `#939fbf` | 5.39:1  |

  `web/plugins/_tests/vuetify.spec.ts` recomputes every one of these from `theme.computedThemes` rather than trusting the table, so re-measuring after a token change is automatic.

  **What lands on a filled accent is the other axis, and Vuetify cannot be left to decide it.** Its pick is `whiteContrast > Math.min(blackContrast, 50)` (APCA, `vuetify/lib/util/colorUtils.js`) — deliberately biased to white, with no threshold to configure. On the dark face that bias is wrong on four roles, one of which is the app bar, so it was the most visible text in the app. Declaring `on-<role>` short-circuits the pick (`theme.js`: `if (color.startsWith('on-') || colors['on-' + color]) continue`), and only the four are declared — the rest are Vuetify's own pick, guarded by the spec rather than assumed:

  | Fill        | Light content | Ratio  | Dark content    | Ratio   |
  | ----------- | ------------- | ------ | --------------- | ------- |
  | `primary`   | white         | 5.89:1 | **black** (set) | 8.71:1  |
  | `accent`    | white         | 5.90:1 | **black** (set) | 8.80:1  |
  | `error`     | white         | 5.20:1 | **black** (set) | 6.68:1  |
  | `success`   | white         | 5.28:1 | **black** (set) | 15.30:1 |
  | `warning`   | white         | 6.21:1 | black           | 12.32:1 |
  | `info`      | white         | 5.33:1 | black           | 15.17:1 |
  | `secondary` | white         | 9.15:1 | white           | 9.15:1  |

  The `on-success: '#ffffff'` that used to be forced across both faces is why this axis went unnoticed: it was written when `success` was one shared `#50fa7b`, and the per-face split left it forcing white onto the dark green at 1.37:1 while the light face reached white on its own anyway. Only the dark half is declared now.

- **Project idioms:** `GapContainer` (polymorphic `d-flex`/gap wrapper; imports `VSheet`/`VCard` explicitly for `<component :is>`), `PasswordField`'s second `visible` model shared across a password/confirmation pair, `UserCard`'s inline edit mode owning its own update, so the page renders `<UserCard />` bare.

## Known inconsistencies (recorded, not fixed)

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

Three things this does not catch on its own:

- **Master-only UI files arrive as clean additions**, not conflicts — git has nothing on this branch to compare them against. They are deleted in the merge commit (the 2026-08-17 sync deleted 14: the `UI*`/`AuthCard`/badge primitives, `ProfileFormDialog`, `UserGqlFormDialog` and their specs). Left in, they would be unreferenced components styled against master's tokens, with specs that run and pad this branch's coverage and mutation figures. Every later master commit touching one of those paths raises a modify/delete conflict, resolved as _delete_ each time — that friction is the signal, not a defect.
- **A shared document can auto-merge into a lie.** `features/002` and `007` took master's entry-point edits cleanly in the 2026-08-17 sync and pointed this branch at components it does not have. Read every `catalyst/features/*` diff after the merge, conflicted or not.
- **A bundle document this branch carries and master does not never arrives by merge at all** — `stacks/frontend/nuxt/ui/vuetify/` is master's blind spot. A Catalyst release that changes one reaches this branch only through `tools/upgrade_project.py`, run here. And the merge brings master's bumped `Catalyst version` stamp, which the upgrader reads: it reports "already on vX.Y.Z — nothing to do" while these documents sit a version behind. Set the stamp back to what this branch actually holds, run the upgrader, let it bump. Hit on 1.8.0, whose one Changed entry was `ui/vuetify/components.md`.

A change genuinely wanted in both UI layers is ported deliberately, as its own commit on each branch. It is never a merge resolution.

## Verification

What holds now, not how it got here — the dated narrative is in `git log` and, for the mutation history, in `operations.md`.

- **Suites green on the branch**: Vitest 51 files / 462 tests, Pest, `oxlint`, `oxfmt`, `nuxt typecheck`, `validate.py` 0 errors.
- **The two wiring claims that fail silently are pinned** by `web/plugins/_tests/vuetify.spec.ts`, both sabotage-proven: the locale adapter must be handed `{ global: app.$i18n }` rather than the Composer itself, or Vuetify's own strings render unresolved; and the theme's contrast is asserted on `theme.computedThemes`, not the declared themes, because a removed override yields a different colour rather than a hole.
- **Both contrast axes are measured, per face, from the computed tokens** — accents as foreground against the page and a surface, and content against every fill — so neither a reintroduced shared palette nor a dropped `on-` token can pass. Ratios are in the palette table above.
- **Walked live** in a browser on both faces, measuring rendered pixels: the app bar, the fullscreen dialog's toolbar, `UserCard`'s flat buttons, the consent banner and `error.vue`.
- **The layout holds without measuring**: tables scroll under pinned headers with the page itself unscrollable, and `UserCard` shrinks and scrolls its fields in edit mode while its header controls stay put, both re-adapting to a shrunken viewport.
- **Branch sync** has been run under the policy above, and the two failures the path table cannot catch — a master-only UI file arriving as a clean addition, and a shared document auto-merging into a claim untrue here — were checked by reading the merged result rather than the conflict list. Both are now standing steps of the flow, not observations.

## Contracts Touched

- `project-summary.md` — Technical Stack row (`frontend/ui | vuetify`), ADR Index row for this record.
- `web/CLAUDE.md` — layouts, pages, plugins, and the ui governing-document pointer.

## Open Questions

(none)
