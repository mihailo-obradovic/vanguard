# Nuxt — Testing

**Layer:** Frontend
**Tool:** Vitest 4 · `@nuxt/test-utils` · `@vue/test-utils` · happy-dom · `@vitest/coverage-v8`

How this module tests. Read this when adding a frontend test, deciding what level a piece of behavior should be tested at, or measuring coverage.

## Shape

An SPA built on this stack concentrates its logic below the components: utils, composables, stores, services, query composables. That is where tests earn their keep — a pure function with branches gets a unit test the day it is written, and keeping logic extractable into those layers (the pattern `routing.md` uses for `authRedirectLogic`) is what keeps it testable.

Pages and presentational components are not unit-tested by default. Their behavior is proven from the other side: the backend feature suite pins the API contract, and the prime directive's live browser walk verifies the rendered UI per feature — recorded in each feature's Tests section, as `architecture.md` (Testing) allows. A component earns a mounted test only when it carries real logic of its own — branching render state, non-trivial event handling, its own persistence (`CookieConsentBanner`, not `TheFooter`).

The levels, concretely:

- **Unit** — utils, composables, stores, service functions with the fetcher mocked. The default level; most specs are this.
- **Component** — `@vue/test-utils` `mount`, or `mountSuspended` from `@nuxt/test-utils` when the component needs the Nuxt runtime. Used sparingly, per the rule above.
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
- **Mock at the service/fetcher boundary, not deeper.** A query-composable test mocks its service function; a service test mocks the fetcher. Nothing mocks Pinia Colada internals or Vue reactivity.
- **Descriptions are sentences about behavior**, present tense, matching the backend suite's voice: `it('prefers the server message over the raw ofetch string', ...)`.
- **Every error path in the spec'd unit gets a case** — the error translators (`getErrorMessage`, `getValidationErrors`, `gqlFetcher`'s error table) are tested row by row, the same way feature Examples tables are walked.
- **A bug fix ships its regression spec** (Universal Rule) — failing before, passing after.

## Coverage

`@vitest/coverage-v8` (the v8 provider: native, no instrumentation pass; istanbul remains the documented alternative if per-branch precision ever matters more than speed). Configured in `vitest.config.ts` to measure the whole `web/` tree — `include: ['web/**']` — so unimported files count as uncovered instead of invisible; locale catalogs are excluded as data.

Coverage is **measured, not gated**: CI prints the report but enforces no threshold while recorded gaps are still being closed (`decisions/008`). A number that only ever ratchets by honest test-writing is a signal; a gate over a known-incomplete suite just teaches people to test what is cheap. Revisit gating when the recorded gaps are closed.

## Running

- `pnpm test` — the suite once; `pnpm test:watch` while iterating.
- `pnpm test:coverage` — with the coverage report (`text` to the terminal, `html` + `lcov` into `coverage/`, gitignored).
- The full suite is green before a merge; a failing test is never left for later without saying so.
