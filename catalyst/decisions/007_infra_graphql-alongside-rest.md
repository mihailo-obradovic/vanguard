# Decision: Serve GraphQL alongside REST (Lighthouse + a fetcher-based client)

## Status

Accepted

## Type

infra

## Task Weight

Hard

## Context

Vanguard is REST-only end to end. The project exists as the reference implementation for Catalyst's nuxt + laravel pairing, and GraphQL is a transport other projects spawned from that pairing will want. What was missing was not "a way to send a GraphQL request" — any HTTP client can do that — but an ergonomic layer that makes a GraphQL call cost a component exactly what a REST call costs it today: a query composable, no loading refs, no try/catch, inline 422s, one central toast.

The reference for the wrapper shape is a prior project (`pro-backup`), which layers gql document → thin service function → async-state composable → page. That layering is already what feature 005 mandates here for REST, so the work is to reuse it rather than invent a parallel one.

## Decision

**Add GraphQL as a second transport over the same domain code, not as a replacement for REST**, with three sub-decisions that were genuinely contested:

- **`nuwave/lighthouse` for the server, schema-first.** It is the only maintained Laravel GraphQL server with directive-driven authorization and validation that map onto what this project already has: `@canModel`/`@canFind` read the same Laravel policies, and a Lighthouse `Validator` class is the FormRequest equivalent, dynamic `unique` rule included. A hand-rolled `webonyx/graphql-php` endpoint would have meant re-deriving all of that.

- **No GraphQL client library on the frontend.** `graphql-request`, urql, and Apollo all bring their own transport, which would have meant re-implementing credentialed cookies, the CSRF header, the 419 refresh-and-retry, and `FetchError`-typed central error handling for a second time — and Pinia Colada already provides the caching those clients are mostly bought for. Instead `gqlFetcher` posts `{ query, variables }` through the existing `web/utils/fetcher.ts`. The one thing this gives up is a normalized document cache, which the project does not use on the REST side either.

- **The API Resource stays the single outward contract for both transports.** GraphQL resolvers return `UserResource::make($user)->resolve()` rather than the Eloquent model, so a user serializes byte-for-byte the same over both transports and the frontend reuses `UserSchema` verbatim. Resolving the model directly would have leaked the `role` enum object and Carbon timestamps into the schema and forced a second, drifting response type on the client.

A fourth consequence follows from the second: GraphQL reports failures as HTTP 200 with an `errors` array, so `gqlFetcher` translates those into the `FetchError` shape the existing pipeline already understands — `extensions.validation` becomes a 422 with Laravel's `{ errors: { field: [...] } }` body, authentication becomes 401, authorization 403. Nothing in `handleApiError`, `getValidationErrors`, `useValidationErrors`, `useAppQuery`, or `useAppMutation` changes.

## Scope

Backend: `composer.json` (+ `nuwave/lighthouse`, dev `mll-lab/laravel-graphiql`), `config/lighthouse.php`, `graphql/schema.graphql`, `app/GraphQL/`, `app/Policies/UserPolicy.php`, `app/Actions/UpdateUser.php`, `tests/Feature/GraphQL/`.

Frontend: `web/utils/gql.ts`, `web/utils/gqlFetcher.ts` (+ spec), `web/services/user.gql.ts`, `web/services/queries/useUserGqlQueries.ts`, `web/pages/graphql-demo.vue`, `web/types/user.ts`, the three locale catalogs.

One existing behavior contract is touched only by refactor: `UserController::update` moves its body into `app/Actions/UpdateUser.php` so both transports run the same update logic. The REST request/response shape, status codes, and side effects are unchanged — the alternative was two implementations of one documented behavior, which is how the transports drift.

## Consequences

- The user-management behavior of feature 002 now has two entry points. They share the policy, the validation rules, the update action, and the resource, so the drift surface is the schema file rather than the logic.
- Authorization is expressed twice by necessity: REST gates on the `admin` route middleware, GraphQL per field on `UserPolicy`. The policy is the new home of the rule; the middleware defers to the same `isAdmin()` check.
- Adding a policy makes Laravel's gate auto-discovery active for `User`, which previously had none. No existing code calls `authorize()` on users, so REST behavior is unchanged — asserted by the existing suite.
- GraphiQL is a dev-only dependency and must never be enabled in production; it is registered behind the local environment.
- Anything the GraphQL layer wants that Pinia Colada cannot express (normalized caching, fragment colocation, persisted queries) is a new decision, not a small addition.
- The stack-module documents that would let another project adopt this are deliberately not written here; porting the pattern into Catalyst as opt-in `graphql` addons for the `laravel` and `nuxt` modules is the follow-up to this record.

## Contracts Touched

- `project-summary.md` — feature index row 007, ADR index row 007, Technical Stack note.
- `features/007_graphql-api.md` — the behavior contract this record enables.
- `features/002_user-management.md` — Protected Areas note: a second transport now reads and updates users; the REST contract itself is unchanged.
- `web/CLAUDE.md`, `app/CLAUDE.md` — folder maps for the new directories.

Dependency Change Rule: `nuwave/lighthouse` (runtime) and `mll-lab/laravel-graphiql` (dev) were approved by the user when this record was accepted. No frontend runtime dependency is added.

## Open Questions

## Verification

Pest feature tests for the query and mutation (happy path, guest, non-admin, validation, email-change side effect) plus the untouched existing suite; a Vitest spec for the error translation in `gqlFetcher`; `vue-tsc`, oxlint, oxfmt; and a live walk of `/graphql-demo` in the browser proving the list loads, the mutation updates, a duplicate email renders inline on the field, and a non-admin is refused.
