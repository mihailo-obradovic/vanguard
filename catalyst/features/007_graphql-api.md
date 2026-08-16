# Feature: GraphQL API

## Status

Active

## Task Weight

Hard

## Purpose

Demonstration contract: a GraphQL transport whose call sites cost a component exactly what REST costs it — a query composable, no manual loading state, no try/catch, inline field errors, one central toast — so a project spawned from this pairing adopts GraphQL without a second data-layer idiom. Rationale, rejected alternatives, and the pattern's edges (what a GraphQL-first project would do differently) live in `decisions/007_infra_graphql-alongside-rest.md`.

The slice deliberately mirrors a REST resource (users, feature 002) so the two paths read side by side. It is a template, not the primary path: the shipped pages keep using REST.

## Inputs

| Input                           | Type                                    | Source                     | Constraints                                                                                      |
| ------------------------------- | --------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------ |
| `POST /graphql` body            | `{ query: string, variables?: object }` | Nuxt SPA via `gqlFetcher`  | JSON; session cookie required; `X-XSRF-TOKEN` header required (state-altering verb)              |
| `users` query                   | no arguments                            | GraphQL document           | Caller must satisfy `UserPolicy::viewAny` (admin)                                                |
| `updateUser` mutation arguments | `id: Int!`, plus optional user fields   | GraphQL document variables | `name`, `email`, `password`, `password_confirmation`, `role`; each validated as in `UserRequest` |

## Outputs And Side Effects

| Output / Side Effect      | Type                | Description                                                                                              |
| ------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------- |
| `data.users`              | `User[]`            | All users, newest first — the same objects `GET /api/users` returns, from the same `UserResource`        |
| `data.updateUser`         | `User`              | The updated user, same serialization                                                                     |
| `errors[]`                | GraphQL error array | HTTP status stays 200; the client translates this into the REST-equivalent error (see Error Handling)    |
| Email verification notice | queued notification | Sent when `updateUser` changes the email — identical to REST, because both call `App\Actions\UpdateUser` |

## Scope And Non-Goals

In scope:

- A Lighthouse `/graphql` endpoint on the same Sanctum session cookie as REST.
- A `users` query and an `updateUser` mutation over the existing user domain.
- The wrapper layer: `gql` tag, `gqlFetcher`, a `.gql.ts` service, a query-composable file, and a demo page.
- Error translation from the 200-with-`errors` envelope into the existing `FetchError` handling.
- GraphiQL at `/graphiql`, local environment only.

Non-goals:

- Migrating any existing page or endpoint off REST; the surfaces of features 001–003 are unchanged.
- Nested relationship fields — resolvers return finished `UserResource` arrays, so `user { posts … }` cannot be added incrementally; the expansion is its own decision record, priced in ADR 007.
- Schema code generation — `gql` is an identity tag; documents are validated at runtime, not at build time. Revisit trigger in ADR 007.
- Subscriptions, file uploads, batched or persisted queries, pagination (`@paginate` exists when needed), fragment colocation, normalized client caching.
- A GraphQL equivalent of every REST endpoint: create and delete stay REST-only; the pattern generalizes without them.
- Publishing the pattern as Catalyst stack modules (an ADR 007 follow-up).

## User / System Behavior

- When an admin's SPA session issues the `users` query, the system returns every user, newest first, serialized by `UserResource`.
- When an admin issues `updateUser`, the system validates the arguments, applies the change through the shared update action, and returns the updated user. The demo page sends only the arguments the admin changed — an omitted variable never reaches the resolver, so untouched fields keep their values (partial input is a GraphQL advantage the demo exists to show).
- When `updateUser` changes the email address, the system clears `email_verified_at` and queues a verification notification — the same side effect as REST.
- When a guest issues any operation, the system reports an authentication failure and the client behaves as on a REST 401 (auth store cleared, redirect to login); a signed-in non-admin gets an authorization failure, handled as a REST 403.
- When arguments fail validation, the system reports the failures keyed by argument name, and the client renders them inline on the matching form fields without a toast — the same path a REST 422 takes.
- When a component consumes a GraphQL operation, it does so through a query composable built on `useAppQuery` / `useAppMutation`, never by calling `gqlFetcher` directly.

## Roles And Access

| Resource / Action            | Guest | User | Admin |
| ---------------------------- | ----- | ---- | ----- |
| `POST /graphql` (reachable)  | ✗     | ✓    | ✓     |
| `users` query                | ✗     | ✗    | ✓     |
| `updateUser` mutation        | ✗     | ✗    | ✓     |
| `/graphiql` (local env only) | ✓     | ✓    | ✓     |

Per-role experience: a **guest** is bounced to login by the central 401 handling; a **user** reaching `/graphql-demo` sees the page shell, then the 403 handling sends them to `/home` (the same treatment `/users` gives); an **admin** sees the list and edits inline.

Authorization is enforced per field by `UserPolicy` (`viewAny`, `update`), not by route middleware — the endpoint itself is only gated on being authenticated, because one endpoint serves fields with different requirements.

## Examples

| Input                                                     | Expected Output                                                | Notes                                       |
| --------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------- |
| Admin: `{ users { id name email role } }`                 | `data.users` — all users, newest first                         | Same order and shape as `GET /api/users`    |
| Admin: `updateUser(id: 3, name: "Ada")`                   | `data.updateUser` — user 3 with the new name                   | Untouched fields keep their values          |
| Admin: `updateUser(id: 3, email: <another user's email>)` | `errors[0].extensions.validation.email` — "already been taken" | Client shows it inline on the email field   |
| Admin: `updateUser(id: 3, email: "new@example.com")`      | `data.updateUser.email_verified_at` is `null`                  | Verification notification queued            |
| `updateUser(id: 99999, name: "X")`                        | `errors[0]` — model not found                                  | `@canFind` fails closed before the resolver |

Guest and non-admin refusals: see Roles And Access; client behavior is under Error Handling.

## Business Rules

- Both transports serve the same domain rules: validation mirrors `UserRequest`, the update logic is one action used by both, the outward serialization is one `UserResource`.
- GraphQL response payloads for a user are byte-identical to the REST ones, so one Zod schema (`UserSchema`) validates both. This parity — not GraphQL idiom — is why the schema uses plain `String`/`Int` scalars rather than registered enum and `DateTime` types (ADR 007).
- The endpoint is stateful-session authenticated. It is never opened to token or unauthenticated access without a new decision record.
- GraphiQL is registered only in the local environment; it must not be reachable in staging or production.
- Introspection follows Lighthouse's default; disabling it in production is an operational choice, not a contract.

## Edge Cases

- **Partial data.** A response may carry both `data` and `errors`; the client treats any `errors` entry as failure and never surfaces partial data — the all-or-nothing expectation REST call sites are written against.
- **Expired CSRF token.** Handled below the GraphQL layer: `gqlFetcher` posts through `fetcher`, so a 419 refreshes the cookie and retries once.
- **Transport-level failure** (500, network, HTML error page): surfaces as an ordinary `FetchError`, handled centrally, unchanged.
- **Unknown validation key.** A validation error whose key matches no form field still toasts through the generic path rather than being silently dropped.
- **`updateUser` with no changed fields** succeeds and returns the user unchanged; it is not an error.

## Invariants

- No component calls `gqlFetcher` directly; the service → query-composable → component chain is the only path, exactly as for REST.
- `useAppQuery` and `useAppMutation` are used unmodified. If GraphQL ever needs a change to them, it needs a change that REST also gets.
- A GraphQL service function returns Zod-parsed data; the raw envelope never escapes the service layer.
- Every domain rule reachable from GraphQL is also reachable from REST through the same underlying code — no rule lives only in the schema.
- REST query keys and GraphQL query keys never collide: the GraphQL namespace is `users-gql`.

## Error Handling

`gqlFetcher` translates the GraphQL error envelope into the shape the existing pipeline consumes and throws it, so `handleApiError` runs untouched:

| GraphQL signal                  | Translated to                                         | Resulting behavior                      |
| ------------------------------- | ----------------------------------------------------- | --------------------------------------- |
| `extensions.validation` present | status 422, body `{ errors: { field: [messages] } }`  | Inline field errors; toast suppressible |
| Authentication category         | status 401                                            | Auth store cleared, redirect to login   |
| Authorization category          | status 403                                            | Navigate to `/home`                     |
| Any other GraphQL error         | status 500, body `{ message: <first error message> }` | Generic toast                           |
| Non-2xx HTTP response           | passes through as the original `FetchError`           | Existing REST handling                  |

## Entry Points

- `graphql/schema.graphql`: the outward contract of this feature.
- `app/GraphQL/`: thin resolvers returning `UserResource` output, `Validators/UpdateUserValidator.php` (the FormRequest mirror), `ErrorHandlers/RestStatusHandler.php`.
- `app/Policies/UserPolicy.php`: the rule the `@can*` directives read.
- `app/Actions/UpdateUser.php`: the update logic shared with `UserController::update`.
- `web/utils/gqlFetcher.ts`: the transport and error translation.
- `web/services/user.gql.ts` + `web/services/queries/useUserGqlQueries.ts`: the two-layer contract, GraphQL flavor.
- `web/pages/graphql-demo.vue`: the worked call site.

## Dependencies

- `nuwave/lighthouse` (server) and `mll-lab/laravel-graphiql` (dev-only explorer).
- Feature 001: the session cookie and CSRF flow the endpoint authenticates on.
- Feature 002: the domain exposed here; its REST contract is unchanged.
- Features 005/006: the wrapper conventions and inline-422 path this extends.

## Open Questions

## Tests

- `tests/Feature/GraphQL/UserQueryTest.php`: admin list order; non-admin/guest refusal; payload matches the REST serialization field for field.
- `tests/Feature/GraphQL/UpdateUserMutationTest.php`: updates; email-change side effect; duplicate-email validation keyed `email`; non-admin/guest refusal; unknown id.
- `tests/Feature/GraphQL/QueryCacheConfigTest.php`: guards the `opcache` query-cache mode against Laravel's `cache.serializable_classes => false` hardening (the `store` mode 500s on warm hits).
- `tests/Feature/UserManagementTest.php`: unchanged and green — the proof that extracting the update action did not alter the REST contract.
- `web/utils/_tests/gqlFetcher.spec.ts`: each row of the Error Handling table, plus the success path.
- `web/services/_tests/user.gql.spec.ts` and `queries/_tests/useUserGqlQueries.spec.ts`: operation naming, REST field parity, `id` as a variable, schema mismatches rejecting, and `users-gql` refreshing only itself.

## Verification

Backend `php artisan test` green, including the payload-parity case and the untouched REST suite; frontend `pnpm test`/`typecheck`/`lint`/`format` green. Live walk at `/graphql-demo`: list loads, a duplicate email renders inline with no toast, a successful update closes the dialog and refetches, a non-admin lands on `/home`, a guest gets 401. Remaining risk: the client keys on `extensions.status` from `RestStatusHandler`; a Lighthouse upgrade changing exception wrapping would degrade errors to generic toasts — the Pest tests assert the status per error class, so that fails the suite instead.

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document and `decisions/007_infra_graphql-alongside-rest.md`.
2. Identify which documented behavior or invariant is affected — in particular whether the change would make GraphQL and REST diverge on a shared domain rule.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior, on both transports when the rule is shared.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
