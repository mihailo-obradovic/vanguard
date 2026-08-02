# Vanguard — project instructions

## To-do list (Workflowy)

The Workflowy MCP server is connected and acts as the task tracker for this project.

- **The to-do list is the Workflowy node `Home → Work → Vanguard`** (node id `5a55338a-20d1-0ab4-8cbe-3d075daaf161`). Treat this node and its descendants as the single source of truth for project tasks.
- Scope: for this project, "the to-do list" always means that node. Do not treat other parts of the Workflowy tree as project tasks.
- When I say something like **"let's tackle X from the to-do list"**, look up task X under the Vanguard node (search/get within that id), then work on it.
- **When a task is finished, mark it complete in Workflowy** (`workflowy_complete` on that node's id). Don't delete it.
- Tasks may carry inline hashtags like `#high-priority`, `#back-end`, `#full-stack`, `#lowpriority`; completed/older items live under the `#archive` child.

## Front-end API communication (Pinia Colada)

All API communication goes through Pinia Colada in two layers. When adding endpoints for a new resource, create both files:

### 1. Service file — `web/services/<resource>.api.ts`

Pure async functions calling `fetcher<T>()`, named `fetchItems`/`fetchItem` (or `get…`), `createItem`, `updateItem`, `deleteItem`. Response types are defined at the top of the service file (they are only used there); shared domain types live in `web/types/`. Service functions must have no side effects beyond the HTTP call — no store access, no toasts, no navigation.

### 2. Query file — `web/services/queries/use<Resource>Queries.ts`

Named after the service file. It contains:

- A `<resource>QueryKeys` const listing hierarchical keys for every operation, e.g. `{ fetchUsers: ['users', 'fetch'], createUser: ['users', 'create'] } as const`. Parameterized keys append the params: `key: () => [...usersQueryKeys.fetchUser, id.value]`.
- One composable per operation built on `useAppQuery`/`useAppMutation` (never raw `useQuery`/`useMutation` — the wrappers add centralized error handling). Query composables take `Ref` params plus an `options: Omit<AppQueryOptions<T>, 'key' | 'query'> = {}` passthrough; mutation composables take an options passthrough too, and must chain the caller's hook after any internal one (`await options.onSuccess?.(…)`).
- Mutations invalidate affected query keys via `useQueryCache().invalidateQueries()` in `onSettled` — components never update cached lists manually.
- Store side effects (e.g. syncing the auth user) belong in the composable's internal `onSuccess`, not in services or components.

### Response validation (Zod)

Service functions never assert response types with `fetcher<T>()` generics — they parse: `parseResponse(Schema, await fetcher(url))` (`web/utils/parseResponse.ts`). Domain schemas live next to the types they produce (`UserSchema`/`UserEnvelopeSchema` in `web/types/auth.ts`, `UsersResponseSchema` in `web/types/user.ts`) and the domain types are `z.infer` of them — never hand-write a type a schema can infer. Response-only schemas (e.g. `StatusSchema`) stay at the top of the service file. Request/form payload types remain hand-written. Void endpoints skip parsing.

### Component rules

- Import query composables explicitly from `@/services/queries/…` and consume their state: `data`, `error`, and `isLoading`/`asyncStatus` for loading indicators and button disabled states. Don't add manual `ref()` loading flags.
- No try-catch around queries/mutations: errors are handled centrally (`handleApiError` toasts and handles 401/403 redirects). Opt out of the toast with `errorHandling: { hideToast: true }`.
- Success toasts, navigation, and closing modals go in the page-level `onSuccess` passed to the composable; trigger mutations with `mutate` (fire-and-forget) rather than `mutateAsync` unless the result is needed inline.

## Form validation (Regle)

Forms validate client-side with Regle (`@regle/core` + `@regle/rules`); rules mirror the backend FormRequest for the endpoint (required, `email`, `maxLength(255)`, `minLength(8)` for passwords, `sameAs` for confirmations, `requiredIf` for conditional fields). The pattern:

- The form component keeps its plain `ref` form model and calls `useRegle(form, rules, { externalErrors })`. Rules that depend on props (e.g. create vs edit mode) use a rules getter.
- Inputs bind `:error-messages="r$.<field>.$errors"`; confirm buttons bind `r$.$invalid`; submit handlers `await r$.$validate()` before emitting/mutating; dialogs call `r$.$reset()` when they close or (re)open.
- **Server 422s appear inline, not as toasts.** Mutations behind a validated form pass `errorHandling: { hideValidationToast: true }`. The parent derives field-keyed errors with `useValidationErrors(mutationError)` and passes them to the form component's `serverErrors` prop; the component feeds them to Regle via `useExternalErrors(() => props.serverErrors)`. A page that owns its own mutation chains both: `useExternalErrors(useValidationErrors(error))`. Regle auto-clears a field's server error when the user edits that field.
- Don't add manual `isFormValid` computeds or validation toasts — Regle owns validity, and non-422 errors still toast centrally.

<!-- catalyst:begin -->
@catalyst/AGENTS.md
<!-- catalyst:end -->
