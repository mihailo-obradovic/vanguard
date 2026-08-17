# web/ — Nuxt frontend

The Nuxt 4 SPA (`ssr: false`). This directory is only the source tree — the app is configured from the repo root: `nuxt.config.ts` (with `srcDir: 'web/'`), `package.json`, `tsconfig.json`, `vitest.config.ts`, `.oxlintrc.json`, `.oxfmtrc.json`. pnpm only.

Paths below are relative to the repo root. The `catalyst/` documents are normative for how this code is written; this file only says what lives where.

## Structure

- `app.vue` / `error.vue` — entry and error shells; `layouts/Default.vue` is the single layout.
- `assets/styles/main.css` — the design tokens every scoped block builds on, plus the few base-element rules. The only global CSS there is.
- `components/_shared/` — auto-imported shared components (`components.dirs` in `nuxt.config.ts`); everything else is explicitly imported. `UIField.vue` and `UIDialog.vue` (+ `UIDialogActions.vue`) are the primitives every form and dialog builds from; `AuthCard.vue` is the shell the four auth screens are made of, and `RoleBadge.vue` / `VerificationBadge.vue` are the two status pills the table and the profile view share.
- `components/<resource>/` — feature components, imported explicitly: `users/UserFormDialog.vue`, `users/UserGqlFormDialog.vue` and `profile/ProfileFormDialog.vue` own the forms their pages used to hold inline.
- `composables/` — `useAppQuery` / `useAppMutation` (the only query/mutation wrappers components may use), `useValidationErrors` / `useExternalErrors` (server-422-to-Regle bridge), `useCookieConsent`.
- `i18n/` — message catalogs and the Vue I18n config; has its own `CLAUDE.md`.
- `mocks/` — test-only: the MSW server, its lifecycle setup file, the request recorder, schema-parsed fixtures, and per-resource handlers. Never imported by shipped code.
- `middleware/auth.global.ts` — the only route middleware; a thin wrapper over the pure, unit-tested `utils/authRedirectLogic.ts`.
- `pages/` — file-based routes: `index`, `home`, `profile`, `users`, `graphql-demo`, plus the auth pages (`login`, `register`, `forgot-password`, `password-reset/[token]`).
- `plugins/` — `auth-loader.ts` (restores the session before first render), `vue-toastification.ts`.
- `regle-config.ts` — the `@regle/nuxt` setup file: localized messages for the built-in validation rules.
- `services/` — one `<resource>.api.ts` per resource (auto-imported via `imports.dirs`); `services/queries/` holds the `use<Resource>Queries.ts` composables. Two-layer rule: every resource has both files. A resource served over GraphQL instead uses `<resource>.gql.ts` + `use<Resource>GqlQueries.ts` — the same two layers, the same wrappers, only the transport differs.
- `stores/useAuthStore.ts` — the only Pinia store.
- `types/` — shared domain types and Zod schemas (`auth.ts`, `user.ts`) plus ambient declarations.
- `utils/` — `fetcher.ts` (CSRF cookie + 419-retry), `gqlFetcher.ts` / `gql.ts` (GraphQL over the same fetcher, translating GraphQL errors into the REST-equivalent `FetchError`), `handleApiError.ts` / `setupQueryErrorHandling.ts` (central error handling), `parseResponse.ts` (Zod), `chainAfter.ts` (the options-passthrough ordering rule), `toast.ts`, `authRedirectLogic.ts`.

Tests live in a `_tests/` subdirectory of the directory holding the code under test — `_tests/` (for `app.vue` and `regle-config.ts`), `utils/_tests/`, `services/_tests/`, `services/queries/_tests/`, `composables/_tests/`, `stores/_tests/`, `i18n/_tests/`, `plugins/_tests/`, `components/_shared/_tests/`, `layouts/_tests/` — one spec per source file, same base name. The API is mocked at the wire with MSW, never by stubbing the fetcher or a service module (`catalyst/stacks/frontend/nuxt/testing.md`).

## Governing documents

- Components and SFC style → `catalyst/stacks/frontend/_vue/vue-style.md` (+ `vue-style-examples.md`), naming → `catalyst/stacks/frontend/_vue/component-naming.md` and `catalyst/stacks/frontend/_common/component-naming.md`
- Data layer (`services/`, `services/queries/`, `composables/useApp*`) → `catalyst/stacks/frontend/nuxt/data-layer.md`
- Fetcher and error handling (`utils/`) → `catalyst/stacks/frontend/nuxt/error-handling.md`
- Forms and validation (Regle + Zod, 422s inline) → `catalyst/stacks/frontend/nuxt/validation.md`
- Client state (`stores/`) → `catalyst/stacks/frontend/nuxt/client-state.md`
- Routing and middleware (`pages/`, `middleware/`) → `catalyst/stacks/frontend/nuxt/routing.md`
- UI posture (no component library; project-owned primitives) → `catalyst/stacks/frontend/nuxt/ui/headless.md`
- Message catalogs and user-facing text (`i18n/`) → `catalyst/stacks/frontend/nuxt/addons/i18n.md` (+ `addons/i18n/catalog-hygiene.md`)
- Types and TS conventions (`types/`) → `catalyst/stacks/_lang/typescript/typescript-types.md`

## Local invariants

- `auth.global.ts` runs on every navigation; redirect logic lives in `utils/authRedirectLogic.ts` so it stays unit-testable — change the logic there, not in the middleware.
- A form field is a `<UIField>`, never hand-written `<label>`/`<input>`/error markup: the component owns the generated `id`, the `for` pairing, the `aria-invalid`/`aria-describedby` wiring and the reserved error line. Native attributes (`type`, `required`, `:disabled`) fall through to the control; a control that is not an `<input>` — the role `<select>` — comes in through the slot and takes the same `controlId`.
- A dialog is a `<UIDialog>`: it owns the overlay, `role="dialog"`/`aria-modal`, the title it is labelled by, initial focus, the Tab trap and focus restoration on close, and asks to close through `@close` rather than mutating anything itself. Restoration survives the opener being replaced: the opener's ancestors are snapshotted at open time and the first one still in the document takes focus when the opener itself is gone — a deleted row hands focus back to the table it was in, never to `<body>`. Pages hold no template refs and no focus watchers. The buttons row goes in `<UIDialogActions>` inside the dialog's own content — a form dialog's submit button has to stay inside its `<form>`.
- A dialog form takes `serverErrors` from the page that owns the mutation and emits its finished payload — the page never reaches into it, and the shaping rules (which fields travel, and when) live with the form (`catalyst/stacks/frontend/nuxt/validation.md`, "Two component shapes"). Its subject prop decides the mode; there is no parallel `isEditMode` flag.
- An auth screen is an `<AuthCard>`: the card, its title and hint, the form element, the submit control (including the label swap while a request is in flight) and the footer's link styling all live there. The four auth pages carry no `<style>` block at all — a new one is a sign something belongs in the card instead.
- Colours, radii, shadows and the transition duration come from the tokens in `assets/styles/main.css` — a literal hex or `rgb()` in a component is a missing token, not a local choice. Tokens are named for the role, so two roles may share a value (`--color-text-muted` and `--color-secondary` are both `#6c757d`) and still diverge later.
- A list's loading branch gates on the query's `isPending`, never `isLoading`: `isLoading` is true for background refetches too, so gating on it tears the list down on every invalidation and defeats the `placeholderData` the query wrapper sets (`catalyst/stacks/frontend/nuxt/data-layer.md`).
- Components never call `useQuery`/`useMutation` or the fetcher directly; the service → query-composable → component chain is the only path to the API. This holds for GraphQL too — `gqlFetcher` is a service-layer tool, never called from a component (`catalyst/features/007_graphql-api.md`).
- GraphQL documents are plain strings — the `gql` tag is an identity function and nothing validates them at build time, so a mistyped field fails at runtime. Verify new documents against `graphql/schema.graphql` (GraphiQL at `/graphiql` in dev); the codegen revisit trigger is recorded in `catalyst/decisions/007_infra_graphql-alongside-rest.md`.
- The backend contract this app is built against is a protected area — see Protected Areas in `catalyst/architecture.md`.
- Every user-facing string goes through the catalogs in `i18n/`; strings the backend returns already localized are displayed as received. Plain `.ts` helpers take the translator from `useNuxtApp().$i18n` inside the function, never at module scope.
- Which shell, plugin, and component files are tested, and which are left to the live browser walk on purpose, is recorded in `catalyst/operations.md` — check there before reading a 0% as an oversight.
