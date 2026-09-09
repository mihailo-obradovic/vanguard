# Decision: Dialog-based auth composition over pages (shadcn-vue variant)

## Status

Accepted

## Type

ui

## Task Weight

Hard

## Context

`variant/shadcn-vue` Phase 3 ("Idiom-setting compositions") needs to establish how login, register, forgot-password, and profile self-service editing are composed on this variant, mirroring `variant/vuetify`'s already-proven approach for composition parity. Today the branch still runs auth as four full page routes (`login.vue`, `register.vue`, `forgot-password.vue`, `password-reset/[token].vue`) and profile editing as a dialog (`ProfileFormDialog.vue`) built on a custom headless `UIDialog` primitive. The choice made here is hard to reverse once pages are deleted, changes documented entry points and one routing rule across three protected areas (features 001, 003, 009), and is the pattern Phase 4's breadth conversions will reuse for every other dialog on the branch.

## Decision

Move login, register, and forgot-password off page routes onto three layout-hosted shadcn-vue `Dialog` instances, wired exactly as `variant/vuetify`'s `Default.vue` does: three independent `useMutationDialog`-backed `Ref<boolean>` states, plain `v-model`, hand-off via emitted events (each dialog closes itself before emitting). Flatten `password-reset` to one query-based route (`?token=&email=`), matching vuetify's already-flattened shape, including the matching one-line change to the backend's `ResetPassword::createUrlUsing` closure (`AppServiceProvider.php`). Replace `ProfileFormDialog.vue` with a true inline-edit `UserCard.vue`, matching vuetify (no dialog at all for profile editing). Port `useMutationDialog`, `useDialogForm`, and `useConfirmOnEnter` verbatim from `variant/vuetify` — all three are framework-agnostic logic; Reka UI's `Presence` `after-leave` event covers what Vuetify's `afterLeave` covered. The legacy `UIDialog` primitive keeps backing `UserFormDialog`/`UserGqlFormDialog` (admin user management, feature 002) until Phase 4 reaches them — two dialog primitives coexist on the branch meanwhile.

Rejected alternative: keep auth as pages and add query-param deep-linking (`/?auth=login`) so the guest-only redirect and bookmarks keep working. Rejected as scope creep beyond Phase 3 and vuetify's own precedent — vuetify's variant does not deep-link its dialogs either.

## Scope

`web/pages/` (delete `login.vue`, `register.vue`, `forgot-password.vue`, `password-reset/[token].vue`; add `password-reset.vue`), `web/layouts/Default.vue`, new `web/components/users/{Login,Register,ForgotPassword}Dialog.vue`, new `web/composables/{useMutationDialog,useDialogForm,useConfirmOnEnter}.ts` + specs, new `web/components/users/UserCard.vue` (deletes `web/components/profile/ProfileFormDialog.vue`), `app/Providers/AppServiceProvider.php`. No API or session-contract changes — only frontend entry points and one backend URL string.

## Consequences

Establishes the idiom Phase 4 reuses for the branch's remaining dialogs, and gives the shadcn-vue variant a true composition-parity comparison against vuetify. Two dialog primitives (`UIDialog`, shadcn's `Dialog`) coexist until Phase 4 finishes converting the rest — an accepted transition state for a variant mid-conversion, not a defect. The guest-only redirect rule in `features/001_session-auth.md` is deleted rather than replaced: a stale bookmark to `/login` 404s instead of redirecting, since `/login` stops existing as a route at all (matches vuetify).

## Contracts Touched

`features/001_session-auth.md` (entry points, deleted redirect rule), `features/009_email-verification-password-reset.md` (entry points, reset-link shape, `/login`-navigation reference), `features/003_self-service-profile.md` (entry point, inline-edit description, "modal" → "dialog"), `context/domain-glossary.md` (new "Dialog" term, canonical over "modal").

## Open Questions

None.

## Verification

Per part: specs for `useMutationDialog`/`useDialogForm`/`useConfirmOnEnter`, dialog and `UserCard` component specs, plus a live browser walk (login, register, forgot-password, password-reset, inline profile edit) once each part lands.
