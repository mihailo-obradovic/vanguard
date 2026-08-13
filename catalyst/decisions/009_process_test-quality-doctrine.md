# Decision: Test-quality doctrine — Khorikov rules, MSW at the wire, mutation audits

## Status

Implemented

## Type

process

## Task Weight

Medium

## Context

Decision 008 set up measurement, placement, and level boundaries but said little about what makes an individual test _reliable_ — most of the suite was written after the code it covers, so nothing proved a green test could ever be red, and the mocking guidance ("mock at the service/fetcher boundary") predated any real data-layer tests. The user supplied a distillation of Khorikov's _Unit Testing: Principles, Practices, and Patterns_ to be merged with the reliability practices (red-first regressions, sabotage spot-checks, mutation testing) into standing doctrine. The frontend data-layer specs landed in parallel with this record, mocking at the fetcher boundary — the seam this record supersedes; they stand as a recorded deviation until migrated.

## Decision

- **Adopt the Khorikov framework as the universal test-quality convention** — `conventions/testing.md`: four pillars with refactor-resistance non-negotiable, observable-behavior-only assertions, unit = unit of behavior, managed/unmanaged boundary classification, output > state > communication styles, the complexity×collaborators quadrant, AAA structure rules, and the prohibitions list. Stack modules bind it; they do not restate it.
- **Frontend mocking moves to the wire: MSW.** The backend API is the SPA's unmanaged dependency and is mocked by intercepting HTTP, never by stubbing `$fetch`/ofetch/service modules — so the fetcher, CSRF retry, Zod parsing, and query composables execute for real in tests. This _reverses the service-boundary mocking line in decision 008_ (that record stays authoritative for everything else). `@testing-library/vue` is the preferred component-test layer over raw mount assertions. Both are approved dependencies installed when first used.
- **Mutation testing becomes a periodic audit**: Pest's built-in mutation testing on the backend (`pest --mutate`, first run in this change), Stryker on the frontend once data-layer tests exist. Survivors are triaged — a test is fixed or the mutant is recorded as acceptable; no CI gate, mirroring 008's measure-don't-gate stance. Infection was tried first and dropped: its core does not speak Pest, while Pest 5 ships the same audit natively with zero added dependencies.
- Recorded deviations from the book: backend keeps `test()` naming (project convention wins); `--parallel` test runs stay unprovisioned until needed.

Rejected: adopting the guide as one monolithic file (Catalyst loads context per layer — universal rules landed in a convention, profiles merged into the stack testing modules); making mutation score a CI gate (a known-incomplete suite would teach testing what is cheap).

## Scope

`conventions/testing.md` (new), both stack testing modules, `stacks/frontend/nuxt/nuxt.md` (approved libraries), `operations.md` (mutation-audit runbook), and this record. No new backend dependency — the audit is Pest's own. Test edits only where surviving mutants expose weak assertions. No behavior contracts change.

## Consequences

- Tests are now judged by written criteria — reviewers can point at a rule instead of taste; agents and future contributors inherit the same bar.
- The existing data-layer specs (services, query composables, wrappers, store — written against `mockNuxtImport('fetcher', …)`) are a **known deviation**: kept green as-is, migrated to MSW handlers as a filed follow-up rather than rewritten now. New data-layer tests are written against MSW from the start. Handler shapes must track the backend contract — that drift risk is the known cost of wire mocking; a shared fixture or contract check is the recorded mitigation once handlers exist.
- Mutation runs cost minutes and only on demand; the audit is only as good as its cadence (runbook suggests after each test-writing push).
- 008's mocking line is superseded by this record; readers of 008 are pointed here.

## Contracts Touched

- `conventions/testing.md` — the universal rules (single source; everything else references it).
- `stacks/backend/laravel/testing.md`, `stacks/frontend/nuxt/testing.md` — stack bindings.
- `stacks/frontend/nuxt/nuxt.md` — `msw`, `@testing-library/vue` approved (Dependency Change Rule).
- `operations.md` — mutation-audit runbook + score baseline.
- `project-summary.md` — ADR index row; `decisions/008` — superseded-line pointer.

## Open Questions

## Verification

Catalyst validator and oxfmt clean; both suites green after any survivor-driven test fixes; first `pest --mutate` run completed with every surviving mutant fixed or triaged, baseline score recorded in `operations.md`.
