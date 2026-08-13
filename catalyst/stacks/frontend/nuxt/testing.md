# Nuxt — Testing

**Layer:** Frontend
**Tool:** Vitest 4 · `@nuxt/test-utils` · `@vue/test-utils` · happy-dom · `@vitest/coverage-v8`

How this module tests. Read this when adding a frontend test, deciding what level a piece of behavior should be tested at, or measuring coverage. The universal quality rules — what to assert, when doubles are allowed, proving a test can fail — live in `conventions/testing.md`; this document binds them to Nuxt.

## Shape

An SPA built on this stack concentrates its logic below the components: utils, composables, stores, services, query composables. That is where tests earn their keep — a pure function with branches gets a unit test the day it is written, and keeping logic extractable into those layers (the pattern `routing.md` uses for `authRedirectLogic`) is what keeps it testable.

Pages and presentational components are not unit-tested by default. Their behavior is proven from the other side: the backend feature suite pins the API contract, and the prime directive's live browser walk verifies the rendered UI per feature — recorded in each feature's Tests section, as `architecture.md` (Testing) allows. A component earns a mounted test only when it carries real logic of its own — branching render state, non-trivial event handling, its own persistence (`CookieConsentBanner`, not `TheFooter`).

The levels, concretely:

- **Unit** — the frontend's domain layer: utils, validators, formatters, parsers, store getters and the pure logic inside actions, pure composables (no fetching, no lifecycle, no router). Output-based wherever possible; the default level and the bulk of the suite. Logic embedded in a component's `<script setup>` that cannot be tested without mounting gets extracted first.
- **Data layer** — services, query composables, the fetcher chain — tested against **MSW at the wire** (below), not with module mocks.
- **Component** — `@testing-library/vue` preferred (its queries are behavior-oriented by construction) over raw `@vue/test-utils` assertions; `mountSuspended` from `@nuxt/test-utils` when the component needs the Nuxt runtime. Used sparingly, per the rule above.
- **End-to-end** — deliberately absent. A browser-automation layer (Playwright) becomes worth its runtime and flake budget when the app has enough flows that walking them manually stops scaling; until then the per-feature live browser walk covers it. Adding E2E is a dependency decision — a new record, not a default.
- **Snapshots** — rejected. A snapshot asserts implementation output, not behavior: it goes stale on every markup tweak, and the habitual update-on-red erases the only signal it ever had. Assert what the user observes — rendered text, emitted events, aria state — never serialized trees.

## Placement

Tests live in a `_tests/` subdirectory of the directory holding the code under test: `web/utils/_tests/formatDate.spec.ts` tests `web/utils/formatDate.ts`. One spec file per source file, same base name. The underscore keeps the directory out of Nuxt's scanning conventions and sorts it first; no distant mirror tree to drift out of sync, no spec files interleaved with source.

## Environments

Vitest runs specs in the node environment by default — cheap and sufficient for pure logic. A spec that needs the Nuxt runtime (auto-imports, `useNuxtApp`, plugins) opts in per file:

```ts
// @vitest-environment nuxt
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
```

`mockNuxtImport` stubs auto-imported composables (`authRedirectLogic.spec.ts` is the worked example — it stubs the auth store's state). Keep the nuxt environment the exception: if a util needs it, first ask whether the util should take its dependencies as arguments instead.

## Conventions

- **Assert the contract, not the implementation.** What the function returns, what the component renders or emits — never internal refs, call counts for their own sake, or DOM structure beyond what the behavior requires.
- **A component's public API is its props, emits, slots, and what the user sees and does.** Assert rendered text and accessible roles, what changes after an interaction, emitted payloads, and requests leaving the app; never internal `ref`/`computed` values, child-component internals, CSS classes, or store internals — go through the rendered output. Query by role and text; test-ids are a fallback, not a default.
- **Descriptions are sentences about behavior**, present tense, matching the backend suite's voice: `it('prefers the server message over the raw ofetch string', ...)`.
- **Every error path in the spec'd unit gets a case** — the error translators (`getErrorMessage`, `getValidationErrors`, `gqlFetcher`'s error table) are tested row by row, the same way feature Examples tables are walked.
- **A bug fix ships its regression spec** (Universal Rule) — failing before, passing after.

## The network boundary

The backend API is this app's **unmanaged dependency** — the only thing tests mock, and they mock it **at the wire with MSW**, never by stubbing `$fetch`/ofetch, the fetcher, a service module, or a store action to dodge a request. Everything on this side of the wire — the fetcher with its CSRF retry, Zod parsing, the query composables — executes for real against MSW handlers, so a data-layer test proves the whole chain, not a mock of it.

- Assert on the outgoing request (method, URL, body) when making the call _is_ the behavior — "submitting the form sends the update to the API".
- Handler response shapes must track the backend contract. Drift here is the main way a wire-mocked suite goes quietly false-green; keep handlers next to the Zod schemas they must satisfy, and treat a schema change without a handler change as a red flag in review.
- `msw` and `@testing-library/vue` are approved dependencies (`nuxt.md`); both are installed.

### The mock module — `web/mocks/`

Everything wire-related lives in one directory, excluded from coverage as test infrastructure:

- `server.ts` — the `setupServer()` singleton; `setup.ts` — the lifecycle, registered as Vitest's `setupFiles`.
- `api.ts` — `apiUrl(path)` over the test origin. Requests must be absolute for MSW to intercept them in Node, so `vitest.config.ts` pins `NUXT_PUBLIC_API_BASE_URL` and both the app and the handlers read it from there.
- `requests.ts` — `recordRequests()`, the recorder specs assert against: `trace()` for the call sequence, `at(i)` for method, path, headers and body.
- `fixtures.ts` — `buildUser()`, **parsed through its Zod schema on the way out**, so a fixture that drifts from the contract fails where it is written rather than satisfying a spec that mocks it.
- `handlers/` — the happy path per resource, shaped like the controllers answer (201 on create, 204 on delete and the session routes). A spec overrides one entry with `server.use(...)` for a failure.

Unhandled requests **fail the run** (`onUnhandledRequest: 'error'`) — a request the handlers do not describe is a test lying about what it exercises.

Two things are load-bearing in `setup.ts` and easy to lose in a refactor:

- **The `$fetch` replacement runs at module scope, not in a hook.** The Nuxt test environment builds `$fetch` over its own in-memory h3 app, and `#build/fetch.mjs` — what app code's auto-imported `$fetch` resolves to — captures `globalThis.$fetch` when first imported. Setup files evaluate before the spec's import graph; assigning in `beforeAll` lands after the binding was taken, and requests escape to the real network. This takes the h3 app out of the path, so `registerEndpoint` no longer works — MSW replaces it.
- **Outgoing headers are flattened to a plain record.** The DOM environment's `Headers` class and Node's `fetch` come from different realms, and the foreign instance is dropped silently rather than rejected — erasing `Accept` and `X-XSRF-TOKEN` from every request while the suite stays green.

### Asserting cache invalidation

Mount the query alongside the mutation and assert **the refetch that invalidation causes**, not a spy on `invalidateQueries`: a missing invalidation shows up as a missing request. Mount a query that must _not_ refresh in the same test to pin what a key does not reach.

## Coverage

`@vitest/coverage-v8` (the v8 provider: native, no instrumentation pass; istanbul remains the documented alternative if per-branch precision ever matters more than speed). Configured in `vitest.config.ts` to measure the whole `web/` tree — `include: ['web/**/*.{ts,vue}']` — so unimported files count as uncovered instead of invisible; locale catalogs are excluded as data. The extension filter is load-bearing: a bare `web/**` feeds the folder `CLAUDE.md` files to rolldown, which logs a `PARSE_ERROR` for each one.

Coverage is **measured, not gated**: CI prints the report but enforces no threshold while recorded gaps are still being closed (`decisions/008`). A number that only ever ratchets by honest test-writing is a signal; a gate over a known-incomplete suite just teaches people to test what is cheap. Revisit gating when the recorded gaps are closed.

## Running

- `pnpm test` — the suite once; `pnpm test:watch` while iterating.
- `pnpm test:coverage` — with the coverage report (`text` to the terminal, `html` + `lcov` into `coverage/`, gitignored).
- The full suite is green before a merge; a failing test is never left for later without saying so.
- `pnpm test:mutation` — the Stryker mutation audit over the data layer. Same triage rule as the backend's Pest runs (`conventions/testing.md`), never a CI gate; scope, config rationale, and the standing survivor list live in `operations.md`.
