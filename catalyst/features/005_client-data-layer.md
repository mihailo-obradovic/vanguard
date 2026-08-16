# Feature: Client Data Layer

## Status

Active

A **demonstration contract**: Vanguard exists partly to show this pattern. The conventions live in `catalyst/stacks/frontend/nuxt/data-layer.md` and `error-handling.md` — this document records how _this project_ wires them, not the rules themselves.

## Task Weight

Medium

## Purpose

Give the SPA one disciplined path from component to API so data fetching, caching, response validation, and error handling are uniform and testable rather than scattered across components.

## Inputs

| Input               | Type            | Source                              | Constraints                                                       |
| ------------------- | --------------- | ----------------------------------- | ----------------------------------------------------------------- |
| Query/mutation call | composable call | components → `use<Resource>Queries` | components never call `fetcher`/`useQuery`/`useMutation` directly |
| Request args        | typed params    | query/mutation composable           | typed against `web/types/*`                                       |
| API response        | JSON            | Laravel API via `fetcher`           | parsed through a Zod schema (`parseResponse`) before use          |

## Outputs And Side Effects

| Output / Side Effect      | Type        | Description                                                                                   |
| ------------------------- | ----------- | --------------------------------------------------------------------------------------------- |
| Query/mutation state      | reactive    | `data`/`error`/`status` from Pinia Colada, surfaced through `useAppQuery`/`useAppMutation`    |
| Cache invalidation        | side effect | mutations invalidate related keys in `onSettled` (e.g. `usersQueryKeys.fetchUsers`)           |
| Centralized error routing | side effect | `setupQueryErrorHandling` maps failures (401→login, 403→home, 422 inline/toast) once per call |

## Scope And Non-Goals

In scope: the two-layer `services/<resource>.api.ts` (pure async network functions) → `services/queries/use<Resource>Queries.ts` (Pinia Colada query/mutation composables) → component chain; the `useAppQuery`/`useAppMutation` wrappers; `fetcher.ts`; `parseResponse.ts` (Zod); central error handling (`handleApiError.ts` / `setupQueryErrorHandling.ts`).

Non-goals: the per-endpoint contracts (owned by features 001–003); client form validation UX (feature 006); client state that is not server data (the auth store — `client-state.md`); restating the stack-module rules.

## User / System Behavior

- A component calls a query/mutation composable only — e.g. `useFetchUsers()`, `useCreateUser()`. It never imports `fetcher`, `useQuery`, or `useMutation`.
- Each resource has **both** files: a `.api.ts` of pure functions and a `queries/use<Resource>Queries.ts` of composables. The composable calls the api function inside `useAppQuery`/`useAppMutation`.
- `useAppQuery` keeps prior data as `placeholderData` so navigating between views does not flash empty state; it wires error handling when called in a component instance.
- Mutations invalidate the affected query keys in `onSettled` (create/update/delete users all invalidate `['users','fetch']`; update/delete also invalidate `['users','get', id]`), then chain any caller-supplied `onSettled`.
- `fetcher` sends `credentials: 'include'` and a JSON `Accept`, attaches `X-XSRF-TOKEN` on state-changing methods, and on a 419 re-primes the CSRF cookie and retries exactly once.
- Responses pass through `parseResponse` against a Zod schema; a shape mismatch throws a user-presentable error rather than propagating a malformed object.

## Roles And Access

Not role-specific — the layer is transport plumbing; role gating lives in the endpoints it calls (feature 002).

## Examples

| Input                          | Expected Output                                       | Notes                                 |
| ------------------------------ | ----------------------------------------------------- | ------------------------------------- |
| `useFetchUsers()` on mount     | `UsersResponse` after Zod parse; prior data meanwhile | `placeholderData` prevents flicker    |
| `useCreateUser().mutate(form)` | user created, `['users','fetch']` invalidated         | list refetches via `onSettled`        |
| API returns 419                | CSRF cookie re-primed, request retried once           | transparent to the caller             |
| Response fails its Zod schema  | thrown presentable error, not a malformed object      | `parseResponse` is the contract guard |

## Business Rules

- Two-layer rule: every resource has a `.api.ts` **and** a `queries/` composable file; components consume only the composable.
- One fetcher for the whole app; one central error handler; one Zod parse per response.
- Query keys are nested arrays namespaced by resource (`usersQueryKeys`, `authQueryKeys`).

## Edge Cases

- `useFetchUser`/`GET /api/users/{id}` and its query key exist but no page consumes them (noted in feature 002) — the layer supports more than the UI currently uses.
- `useAppQuery`/`useAppMutation` only wire error handling when `getCurrentInstance()` is truthy, so calling them outside a component setup skips centralized handling.

## Invariants

- Components never call `fetcher`, `useQuery`, or `useMutation` directly — the service → query-composable → component chain is the only path to the API.
- Every server response is validated by a Zod schema before the app consumes it.
- Mutations that change server state invalidate the corresponding query keys.

No protected area of its own — the backend contracts this layer calls are protected by features 001–003 and `architecture.md`.

## Error Handling

- Central `setupQueryErrorHandling`: 401 → reset auth store + `/login`; 403 → `/home`; 422 → inline in opted-in forms (feature 006) else toast; other errors → generic toast. Wired once per query/mutation, not per component.
- 419 is recovered inside `fetcher` (re-prime + one retry) before it reaches the handler.

## Entry Points

- `web/services/*.api.ts` — pure network functions; `web/services/queries/use<Resource>Queries.ts` — the composables and their query keys.
- `web/composables/useAppQuery.ts`, `useAppMutation.ts` — the Pinia Colada wrappers.
- `web/utils/` — `fetcher.ts`, `handleApiError.ts`, `setupQueryErrorHandling.ts`, `parseResponse.ts`.

## Dependencies

- Feature 001: the session/CSRF posture the fetcher assumes.
- Features 002/003: the endpoints and response envelopes this layer calls and parses.
- `@pinia/colada` for query/mutation state and cache; `zod` for response schemas.

## Open Questions

## Tests

- `web/utils/_tests/` — `fetcher.spec.ts` (the CSRF header on state-changing methods only; the 419 re-prime and single retry; a 419 from the CSRF endpoint itself not recovered), `handleApiError.spec.ts` (401/403/422 routing and the inline-validation suppression), `setupQueryErrorHandling.spec.ts` (the watcher and its per-error-object dedupe across components), plus `parseResponse`, `getValidationErrors`, `getErrorMessage`, and `toast`.
- `web/services/_tests/` — `auth.api`, `user.api`, `user.gql` against a mocked fetcher: the endpoint, method and body each function sends, the envelope unwrapping, and a response failing its schema rejecting rather than returning a malformed object.
- `web/services/queries/_tests/` — `useAuthQueries` (the store side effects and their ordering against caller callbacks; the user fetch living inside the login/register mutation), `useUserQueries` and `useUserGqlQueries` (which keys each mutation invalidates, including when the write fails, and the two namespaces staying separate).
- `web/composables/_tests/` — `useAppQuery` (previous data held mid-flight by `placeholderData`) and `useAppMutation`; both cover error handling being wired only inside a component instance.
- `web/stores/_tests/useAuthStore.spec.ts` — `isLoggedIn`/`isAdmin` derivation and the readonly exposure.
- Remaining frontend gaps are outside this layer — the auth dialogs, the shared dialog bases, and the pages (`decisions/008`).

## Verification

Traced against source: the two-layer chain in `services/` + `services/queries/`, wrapper behavior in `useAppQuery`/`useAppMutation` (placeholderData, conditional error wiring), and `onSettled` invalidation in `useUserQueries.ts`.

Every Examples row has a spec — the Zod-parse guard, the 419 retry, `placeholderData`, and `['users','fetch']` invalidation on create — each mutation-checked (the source broken deliberately) to confirm the spec fails without it. Frontend suite green at 161 tests; this layer at 100% statements and lines, and a 100% mutation score across `services`, `services/queries` and `stores` (`operations.md`).

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
