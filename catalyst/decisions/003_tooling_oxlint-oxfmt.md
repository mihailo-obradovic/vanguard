# Decision: oxlint + oxfmt for the frontend toolchain

## Status

Implemented

## Type

tooling

## Task Weight

Easy

## Context

Backfilled at brownfield adoption (2026-08-04). The Nuxt frontend needs a linter and formatter. The default JS/TS choice is ESLint + Prettier; this project ships neither — the observed toolchain is the Rust-based oxc family instead. Recording the de-facto choice per `workflows/brownfield.md`.

## Decision

**oxlint for linting, oxfmt for formatting** (both from the oxc project), over ESLint + Prettier. Wired as the `lint` / `lint:fix` / `format` / `format:check` package scripts, configured by `.oxlintrc.json` and `.oxfmtrc.json`. The backend keeps Laravel Pint for PHP — this decision is frontend-only.

Rejected: **ESLint + Prettier**, the ecosystem default. Its pull is the far larger plugin ecosystem (framework-specific rules, plugins); the oxc tools trade that breadth for order-of-magnitude faster runs and a single config surface, which suits a small, convention-driven SPA where the heavy plugin catalog is not needed.

## Scope

`package.json` scripts, `.oxlintrc.json`, `.oxfmtrc.json`, and CI lint/format steps. No application code behavior; no backend tooling.

## Consequences

- Lint and format runs are fast (native binaries), keeping CI and local checks cheap.
- Fewer available rules/plugins than ESLint — a future need for a rule oxlint lacks would force reopening this choice.
- Two formatting worlds in one repo: oxfmt for TS/Vue, Pint for PHP — expected for a split stack, but contributors must run the right one per side.

## Contracts Touched

- `project-summary.md` — ADR index row.
- Frontend tooling conventions are governed by the stack modules and repo config; this record keeps only the why.

## Open Questions

## Verification

Docs-only. Cross-checked against the running repo on 2026-08-04: `package.json` `lint`/`format` scripts invoke `oxlint`/`oxfmt`, `.oxlintrc.json` and `.oxfmtrc.json` present, no ESLint/Prettier config or dependency exists. CI runs `lint` and `format:check`.
