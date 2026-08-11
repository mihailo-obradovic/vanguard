# web/ — Nuxt frontend

The Nuxt 4 SPA (`ssr: false`). This directory is only the source tree — the app is configured from the repo root: `nuxt.config.ts` (with `srcDir: 'web/'`), `package.json`, `tsconfig.json`, `vitest.config.ts`, `.oxlintrc.json`, `.oxfmtrc.json`. pnpm only.

Paths below are relative to the repo root. The `catalyst/` documents are normative for how this code is written; this file only says what lives where.

## Structure

- `app.vue` / `error.vue` — entry and error shells; `layouts/Default.vue` is the main layout (app bar, navigation drawer, auth dialogs), `layouts/Empty.vue` a bare centered shell for standalone pages.
- `components/_shared/` — auto-imported shared components (`components.dirs` in `nuxt.config.ts`); everything else is explicitly imported.
- `composables/` — `useAppQuery` / `useAppMutation` (the only query/mutation wrappers components may use), `useValidationErrors` / `useExternalErrors` (server-422-to-Regle bridge), `useCookieConsent`.
- `middleware/auth.global.ts` — the only route middleware; a thin wrapper over the pure, unit-tested `utils/authRedirectLogic.ts`.
- `pages/` — file-based routes: `index`, `home`, `profile`, `users`, `password-reset` (reads `?token=&email=` from the query string). There are no auth pages — login, registration, and forgot-password are dialogs (`components/users/`) mounted from `layouts/Default.vue`.
- `plugins/` — `auth-loader.ts` (restores the session before first render), `vuetify.ts` (Vuetify instance, theme, SVG icons), `vue-toastification.ts`.
- `services/` — one `<resource>.api.ts` per resource (auto-imported via `imports.dirs`); `services/queries/` holds the `use<Resource>Queries.ts` composables. Two-layer rule: every resource has both files.
- `stores/useAuthStore.ts` — the only Pinia store.
- `types/` — shared domain types and Zod schemas (`auth.ts`, `user.ts`) plus ambient declarations.
- `utils/` — `fetcher.ts` (CSRF cookie + 419-retry), `handleApiError.ts` / `setupQueryErrorHandling.ts` (central error handling), `parseResponse.ts` (Zod), `toast.ts`, `authRedirectLogic.ts`. Tests are colocated `*.spec.ts`.

## Governing documents

- Components and SFC style → `catalyst/stacks/frontend/_vue/vue-style.md` (+ `vue-style-examples.md`), naming → `catalyst/stacks/frontend/_vue/component-naming.md` and `catalyst/stacks/frontend/_common/component-naming.md`
- Data layer (`services/`, `services/queries/`, `composables/useApp*`) → `catalyst/stacks/frontend/nuxt/data-layer.md`
- Fetcher and error handling (`utils/`) → `catalyst/stacks/frontend/nuxt/error-handling.md`
- Forms and validation (Regle + Zod, 422s inline) → `catalyst/stacks/frontend/nuxt/validation.md`
- Client state (`stores/`) → `catalyst/stacks/frontend/nuxt/client-state.md`
- Routing and middleware (`pages/`, `middleware/`) → `catalyst/stacks/frontend/nuxt/routing.md`
- UI (Vuetify wiring, theme, icons) → `catalyst/stacks/frontend/nuxt/ui/vuetify/setup.md`; composition patterns (dialog base, layout skeleton, forms) → `catalyst/stacks/frontend/nuxt/ui/vuetify/components.md`
- Types and TS conventions (`types/`) → `catalyst/stacks/_lang/typescript/typescript-types.md`

## Local invariants

- `auth.global.ts` runs on every navigation; redirect logic lives in `utils/authRedirectLogic.ts` so it stays unit-testable — change the logic there, not in the middleware.
- Components never call `useQuery`/`useMutation` or the fetcher directly; the service → query-composable → component chain is the only path to the API.
- The backend contract this app is built against is a protected area — see Protected Areas in `catalyst/architecture.md`.
