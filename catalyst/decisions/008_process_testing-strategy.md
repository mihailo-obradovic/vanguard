# Decision: Testing strategy — coverage measurement, test placement, level boundaries

## Status

Implemented

## Type

process

## Task Weight

Medium

## Context

Both suites were healthy but unmeasured and undocumented on the frontend side: ~50 Pest feature tests against real MySQL, 44 Vitest cases across 8 specs colocated in `web/utils/` and `web/i18n/`, no coverage tooling on either side, and no frontend testing doctrine anywhere in the Catalyst bundle (the backend has `stacks/backend/laravel/testing.md`; the Nuxt module had a single "Tests: Vitest" line). The untested surface was recorded honestly but only per-feature. `context/product-description.md` lists closing the gaps as a _should_; deciding the strategy is the prerequisite.

## Decision

- **Coverage is measured, not gated.** Frontend: `@vitest/coverage-v8` (v8 over istanbul — native, no instrumentation pass), measuring the whole `web/**` tree so unimported files count as uncovered. Backend: Pest `--coverage`, driven by the locally installed Xdebug (`XDEBUG_MODE=coverage` set by the composer script) and by PCOV in CI (`setup-php`). Both CI jobs print reports; neither enforces a threshold while recorded gaps remain open — a gate over a known-incomplete suite teaches testing what is cheap. Revisit gating after gap closure — _revisited and answered by `011`: the gaps closed and coverage still is not gated_.
- **Frontend tests live in `_tests/` subdirectories** of the directory holding the code under test (`web/utils/_tests/…`), not colocated at source level and not in a mirror tree. Backend keeps Laravel's `tests/Feature` layout untouched.
- **Level boundaries:** unit tests for the logic layers (utils, composables, stores, services with mocked fetcher — _the mocking seam was later moved to the wire: MSW, per `009`_); mounted component tests only for logic-bearing components; backend feature tests + the prime directive's live browser walk stand in for page/E2E coverage. **E2E (Playwright) deferred** until flow count makes manual walks stop scaling — adopting it is a future record. **Snapshot tests rejected** — they assert implementation output and rot on every markup tweak.

Rejected: istanbul provider (slower, precision not needed), PCOV locally (Xdebug already installed and equivalent for line coverage), enforcing thresholds now, blanket component/page testing, snapshots.

## Scope

`vitest.config.ts`, `package.json` (scripts + dev dependency), `composer.json` (`test:coverage`), `.github/workflows/ci.yml` (coverage in both jobs), the 8 spec moves, and the documents listed below. No behavior contracts change.

## Consequences

- Coverage baselines exist and are visible on every CI run: backend **94% lines**, frontend **17.4% statements** (utils/stores covered; services, query composables, error handling, components at zero).
- Gap-closure work is filed on the project to-do list (frontend data layer, targeted components, backend negative paths) instead of living only in feature docs.
- The frontend doctrine now exists as `stacks/frontend/nuxt/testing.md`; porting a generalized version to the canonical Catalyst template is a named follow-up (also on the to-do list).
- Two coverage drivers (Xdebug local, PCOV CI) can in principle disagree on line attribution; acceptable for measure-only use.
- No gate means coverage can silently regress until gating is revisited.

## Contracts Touched

- `stacks/frontend/nuxt/testing.md` — new module document (the rules live there, not here).
- `stacks/frontend/nuxt/nuxt.md` — Module Documents table + `@vitest/coverage-v8` in Approved Libraries (Dependency Change Rule).
- `operations.md` — coverage commands and CI description.
- `project-summary.md` — ADR index row.
- Feature docs 001/005/006/007 and decision 006 — spec paths updated for the `_tests/` move; `web/CLAUDE.md`, `web/i18n/CLAUDE.md` likewise.

## Open Questions

## Verification

`pnpm test` (8 files, 44 tests) and `composer test` (50 tests, 145 assertions) green after the moves; `pnpm test:coverage` and `composer test:coverage` produce the reports quoted above; typecheck, oxlint, and oxfmt clean. CI runs both coverage commands on this branch's PR.
