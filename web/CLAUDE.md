# web/ — Nuxt frontend

The Nuxt 4 SPA (`ssr: false`). This directory is only the source tree — the app is configured from the repo root: `nuxt.config.ts` (with `srcDir: 'web/'`), `package.json`, `tsconfig.json`, `vitest.config.ts`, `.oxlintrc.json`, `.oxfmtrc.json`. pnpm only.

Paths below are relative to the repo root. The `catalyst/` documents are normative for how this code is written; this file only says what lives where.

## Structure

- `app.vue` / `error.vue` — entry and error shells; `layouts/Default.vue` is the main layout (app bar, navigation drawer, auth dialogs), `layouts/Empty.vue` a bare centered shell for standalone pages.
- `components/_shared/` — auto-imported shared components (`components.dirs` in `nuxt.config.ts`); everything else is explicitly imported.
- `composables/` — `useAppQuery` / `useAppMutation` (the only query/mutation wrappers components may use), `useValidationErrors` / `useExternalErrors` (server-422-to-Regle bridge), `useCookieConsent`.
- `i18n/` — message catalogs and the Vue I18n config; has its own `CLAUDE.md`.
- `mocks/` — test-only: the MSW server, its lifecycle setup file, the request recorder, schema-parsed fixtures, and per-resource handlers. Never imported by shipped code.
- `middleware/auth.global.ts` — the only route middleware; a thin wrapper over the pure, unit-tested `utils/authRedirectLogic.ts`.
- `pages/` — file-based routes: `index`, `home`, `profile`, `users`, `graphql-demo`, `password-reset` (reads `?token=&email=` from the query string). There are no auth pages — login, registration, and forgot-password are dialogs (`components/users/`) mounted from `layouts/Default.vue`.
- `plugins/` — `auth-loader.ts` (restores the session before first render), `vuetify.ts` (Vuetify instance, theme, SVG icons, the Vue I18n locale adapter), `vue-toastification.ts`.
- `regle-config.ts` — the `@regle/nuxt` setup file: localized messages for the built-in validation rules.
- `services/` — one `<resource>.api.ts` per resource (auto-imported via `imports.dirs`); `services/queries/` holds the `use<Resource>Queries.ts` composables. Two-layer rule: every resource has both files. A resource served over GraphQL instead uses `<resource>.gql.ts` + `use<Resource>GqlQueries.ts` — the same two layers, the same wrappers, only the transport differs.
- `stores/useAuthStore.ts` — the only Pinia store.
- `types/` — shared domain types and Zod schemas (`auth.ts`, `user.ts`) plus ambient declarations.
- `utils/` — `fetcher.ts` (CSRF cookie + 419-retry), `gqlFetcher.ts` / `gql.ts` (GraphQL over the same fetcher, translating GraphQL errors into the REST-equivalent `FetchError`), `handleApiError.ts` / `setupQueryErrorHandling.ts` (central error handling), `parseResponse.ts` (Zod), `toast.ts`, `authRedirectLogic.ts`.

Tests live in a `_tests/` subdirectory of the directory holding the code under test — `utils/_tests/`, `services/_tests/`, `services/queries/_tests/`, `composables/_tests/`, `stores/_tests/`, `i18n/_tests/`, `plugins/_tests/` — one spec per source file, same base name. The API is mocked at the wire with MSW, never by stubbing the fetcher or a service module (`catalyst/stacks/frontend/nuxt/testing.md`).

## Governing documents

- Components and SFC style → `catalyst/stacks/frontend/_vue/vue-style.md` (+ `vue-style-examples.md`), naming → `catalyst/stacks/frontend/_vue/component-naming.md` and `catalyst/stacks/frontend/_common/component-naming.md`
- Data layer (`services/`, `services/queries/`, `composables/useApp*`) → `catalyst/stacks/frontend/nuxt/data-layer.md`
- Fetcher and error handling (`utils/`) → `catalyst/stacks/frontend/nuxt/error-handling.md`
- Forms and validation (Regle + Zod, 422s inline) → `catalyst/stacks/frontend/nuxt/validation.md`
- Client state (`stores/`) → `catalyst/stacks/frontend/nuxt/client-state.md`
- Routing and middleware (`pages/`, `middleware/`) → `catalyst/stacks/frontend/nuxt/routing.md`
- UI (Vuetify wiring, theme, icons) → `catalyst/stacks/frontend/nuxt/ui/vuetify/setup.md`; composition patterns (dialog base, layout skeleton, forms) → `catalyst/stacks/frontend/nuxt/ui/vuetify/components.md`
- Message catalogs and user-facing text (`i18n/`) → `catalyst/stacks/frontend/nuxt/addons/i18n.md` (+ `addons/i18n/catalog-hygiene.md`)
- Types and TS conventions (`types/`) → `catalyst/stacks/_lang/typescript/typescript-types.md`

## Local invariants

- `auth.global.ts` runs on every navigation; redirect logic lives in `utils/authRedirectLogic.ts` so it stays unit-testable — change the logic there, not in the middleware.
- Components never call `useQuery`/`useMutation` or the fetcher directly; the service → query-composable → component chain is the only path to the API. This holds for GraphQL too — `gqlFetcher` is a service-layer tool, never called from a component (`catalyst/features/007_graphql-api.md`).
- GraphQL documents are plain strings — the `gql` tag is an identity function and nothing validates them at build time, so a mistyped field fails at runtime. Verify new documents against `graphql/schema.graphql` (GraphiQL at `/graphiql` in dev); the codegen revisit trigger is recorded in `catalyst/decisions/007_infra_graphql-alongside-rest.md`.
- The backend contract this app is built against is a protected area — see Protected Areas in `catalyst/architecture.md`.
- Every user-facing string goes through the catalogs in `i18n/`; strings the backend returns already localized are displayed as received. Plain `.ts` helpers take the translator from `useNuxtApp().$i18n` inside the function, never at module scope.
