# Feature: GraphQL API

## Status

Approved

## Task Weight

Hard

## Purpose

Demonstration contract: give the project a GraphQL transport whose call sites cost a component exactly what the REST transport costs it — a query composable, no manual loading state, no try/catch, inline field errors, one central toast — so that a project spawned from this pairing can adopt GraphQL without inventing a second data-layer idiom. The rationale and the rejected alternatives are in `decisions/007_infra_graphql-alongside-rest.md`.

The demonstrated slice is deliberately a mirror of an existing REST resource (users, feature 002) so the two paths can be read side by side. It is a template, not the primary path: the shipped pages keep using REST.

## Inputs

| Input                           | Type                                    | Source                     | Constraints                                                                                      |
| ------------------------------- | --------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------ |
| `POST /graphql` body            | `{ query: string, variables?: object }` | Nuxt SPA via `gqlFetcher`  | JSON; session cookie required; `X-XSRF-TOKEN` header required (state-altering verb)              |
| `users` query                   | no arguments                            | GraphQL document           | Caller must satisfy `UserPolicy::viewAny` (admin)                                                |
| `updateUser` mutation arguments | `id: Int!`, plus optional user fields   | GraphQL document variables | `name`, `email`, `password`, `password_confirmation`, `role`; each validated as in `UserRequest` |

## Outputs And Side Effects

| Output / Side Effect      | Type                | Description                                                                                                       |
| ------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `data.users`              | `User[]`            | All users, newest first — the same objects `GET /api/users` returns, from the same `UserResource`                 |
| `data.updateUser`         | `User`              | The updated user, same serialization                                                                              |
| `errors[]`                | GraphQL error array | HTTP status stays 200; the client translates this into the REST-equivalent error (see Error Handling)             |
| Email verification notice | queued notification | Sent when `updateUser` changes the email — identical to the REST path, because both call `App\Actions\UpdateUser` |

## Scope And Non-Goals

In scope:

- A `/graphql` endpoint served by Lighthouse, authenticated by the same Sanctum session cookie as the REST API.
- A `users` query and an `updateUser` mutation over the existing user domain.
- The frontend wrapper layer: `gql` tag, `gqlFetcher`, a `.gql.ts` service file, a query-composable file, and a demo page consuming them.
- Error translation from GraphQL's 200-with-`errors` envelope into the project's existing `FetchError` handling.
- GraphiQL at `/graphiql`, local environment only.

Non-goals:

- Migrating any existing page or endpoint off REST. The REST surface of features 001–003 is unchanged.
- Subscriptions, file uploads, batched or persisted queries, pagination directives, fragment colocation, normalized client caching, schema code generation.
- A GraphQL equivalent of every REST endpoint. Create and delete stay REST-only; the pattern generalizes without them.
- Publishing the pattern as Catalyst stack modules — that is the follow-up to ADR 007.

## User / System Behavior

- When an admin's SPA session issues the `users` query, the system returns every user, newest first, serialized by `UserResource`.
- When an admin issues `updateUser`, the system validates the arguments, applies the change through the shared update action, and returns the updated user.
- When `updateUser` changes the email address, the system clears `email_verified_at` and queues a verification notification — the same side effect the REST endpoint has.
- When a guest issues any operation, the system reports an authentication failure and the client behaves exactly as it does on a REST 401: the auth store is cleared and the app redirects to login.
- When a signed-in non-admin issues any operation, the system reports an authorization failure and the client behaves as on a REST 403.
- When arguments fail validation, the system reports the failures keyed by argument name, and the client renders them inline on the matching form fields without a toast — the same path a REST 422 takes.
- When a component consumes a GraphQL operation, it does so through a query composable built on `useAppQuery` / `useAppMutation`, never by calling `gqlFetcher` directly.

## Roles And Access

| Resource / Action            | Guest | User | Admin |
| ---------------------------- | ----- | ---- | ----- |
| `POST /graphql` (reachable)  | ✗     | ✓    | ✓     |
| `users` query                | ✗     | ✗    | ✓     |
| `updateUser` mutation        | ✗     | ✗    | ✓     |
| `/graphiql` (local env only) | ✓     | ✓    | ✓     |

Per-role experience: a **guest** hitting any operation is bounced to login by the client's central 401 handling. A **user** reaching `/graphql-demo` sees the page shell, then the central 403 handling navigates them to `/home` — the same treatment `/users` gives them. An **admin** sees the user list and can edit a user inline.

Authorization is enforced per field by `UserPolicy` (`viewAny`, `update`), not by route middleware — the endpoint itself is only gated on being authenticated, because one endpoint serves fields with different requirements.

## Examples

| Input                                                     | Expected Output                                                | Notes                                       |
| --------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------- |
| Admin: `{ users { id name email role } }`                 | `data.users` — all users, newest first                         | Same order and shape as `GET /api/users`    |
| Admin: `updateUser(id: 3, name: "Ada")`                   | `data.updateUser` — user 3 with the new name                   | Untouched fields keep their values          |
| Admin: `updateUser(id: 3, email: <another user's email>)` | `errors[0].extensions.validation.email` — "already been taken" | Client shows it inline on the email field   |
| Admin: `updateUser(id: 3, email: "new@example.com")`      | `data.updateUser.email_verified_at` is `null`                  | Verification notification queued            |
| Non-admin: `{ users { id } }`                             | `errors[0]` authorization failure, `data.users` null           | Client navigates to `/home`                 |
| Guest: `{ users { id } }`                                 | `errors[0]` authentication failure                             | Client clears the auth store, redirects     |
| `updateUser(id: 99999, name: "X")`                        | `errors[0]` — model not found                                  | `@canFind` fails closed before the resolver |

## Business Rules

- Both transports serve the same domain rules. Validation constraints mirror `UserRequest`; the update logic is one action used by both; the outward serialization is one `UserResource`.
- GraphQL response payloads for a user are byte-identical to the REST ones, so one Zod schema (`UserSchema`) validates both.
- The endpoint is stateful-session authenticated. It is never opened to token or unauthenticated access without a new decision record.
- GraphiQL is registered only in the local environment. It must not be reachable in staging or production.
- Introspection follows Lighthouse's default; disabling it in production is an operational choice, not a contract.

## Edge Cases

- **Partial data.** A GraphQL response may carry both `data` and `errors`. The client treats the presence of `errors` as failure and never surfaces partial data, matching the all-or-nothing expectation the REST call sites are written against.
- **Expired CSRF token.** Handled below the GraphQL layer: `gqlFetcher` posts through `fetcher`, so a 419 refreshes the cookie and retries once.
- **Transport-level failure** (500, network, HTML error page): surfaces as an ordinary `FetchError` and is handled centrally, unchanged.
- **Unknown validation key.** A validation error whose key matches no form field still toasts through the generic path rather than being silently dropped.
- **`updateUser` with no changed fields** succeeds and returns the user unchanged; it is not an error.

## Invariants

- No component calls `gqlFetcher` directly; the service → query-composable → component chain is the only path, exactly as for REST.
- `useAppQuery` and `useAppMutation` are used unmodified. If GraphQL ever needs a change to them, it needs a change that REST also gets.
- A GraphQL service function returns Zod-parsed data; the raw envelope never escapes the service layer.
- Every domain rule reachable from GraphQL is also reachable from REST through the same underlying code — no rule lives only in the schema.
- REST query keys and GraphQL query keys never collide: the GraphQL namespace is `users-gql`.

## Error Handling

`gqlFetcher` translates the GraphQL error envelope into the shape the existing pipeline consumes, then throws it, so `setupQueryErrorHandling` → `handleApiError` runs untouched:

| GraphQL signal                  | Translated to                                         | Resulting behavior                      |
| ------------------------------- | ----------------------------------------------------- | --------------------------------------- |
| `extensions.validation` present | status 422, body `{ errors: { field: [messages] } }`  | Inline field errors; toast suppressible |
| Authentication category         | status 401                                            | Auth store cleared, redirect to login   |
| Authorization category          | status 403                                            | Navigate to `/home`                     |
| Any other GraphQL error         | status 500, body `{ message: <first error message> }` | Generic toast                           |
| Non-2xx HTTP response           | passes through as the original `FetchError`           | Existing REST handling                  |

## Entry Points

- `graphql/schema.graphql`: the schema — the outward contract of this feature.
- `app/GraphQL/Queries/Users.php`, `app/GraphQL/Mutations/UpdateUser.php`: resolvers; thin, returning `UserResource` output.
- `app/GraphQL/Validators/UpdateUserValidator.php`: the FormRequest equivalent, including the dynamic `unique` rule.
- `app/Policies/UserPolicy.php`: the authorization rule the `@can*` directives read.
- `app/Actions/UpdateUser.php`: the update logic shared with `UserController::update`.
- `web/utils/gqlFetcher.ts`: the transport and the error translation.
- `web/services/user.gql.ts` and `web/services/queries/useUserGqlQueries.ts`: the two-layer service contract, GraphQL flavor.
- `web/pages/graphql-demo.vue`: the worked call site.

## Dependencies

- `nuwave/lighthouse`: the GraphQL server.
- `mll-lab/laravel-graphiql` (dev): the local schema explorer.
- Feature 001 (session auth): the endpoint authenticates on the same session cookie and CSRF flow.
- Feature 002 (user management): supplies the domain this feature exposes; its REST contract is unchanged.
- Feature 005 (client data layer): the wrapper conventions this feature extends rather than replaces.
- Feature 006 (form validation UX): the inline-422 path the demo page's edit form reuses.

## Open Questions

## Tests

- `tests/Feature/GraphQL/UserQueryTest.php`: admin lists users newest first; non-admin refused; guest refused; payload matches the REST serialization.
- `tests/Feature/GraphQL/UpdateUserMutationTest.php`: admin updates name/role; email change clears verification and queues the notification; duplicate email returns a validation error keyed `email`; non-admin and guest refused; unknown id fails.
- `tests/Feature/UserManagementTest.php`: unchanged, and must stay green — it is the proof that extracting the update action did not alter the REST contract.
- `web/utils/gqlFetcher.spec.ts`: each row of the Error Handling table, plus the success path returning `data`.

## Verification

Filled at implementation.

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document and `decisions/007_infra_graphql-alongside-rest.md`.
2. Identify which documented behavior or invariant is affected — in particular whether the change would make GraphQL and REST diverge on a shared domain rule.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior, on both transports when the rule is shared.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
