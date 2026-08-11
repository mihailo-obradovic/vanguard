# Decision: Hold TypeScript at 5.9.x

## Status

Implemented

## Type

tooling

## Task Weight

Easy

## Context

Backfilled at brownfield adoption (2026-08-04). TypeScript 7 (the native/Go compiler line) is available, and Renovate would otherwise offer the major bump. The type-check path here is `vue-tsc` (via `nuxt typecheck`), and vue-tsc does not yet support TS 7 — so the constraint is the Vue toolchain, not the linter.

## Decision

**Pin `typescript` to an exact `5.9.3`** (not a caret range) alongside `vue-tsc ^3.3.8`, and hold off the TS 7 major until vue-tsc supports it. Revisit around TS 7.1. The exact pin makes the hold explicit and stops range-widening from drifting onto an unsupported major.

Strictness posture is now the standard one: `strictNullChecks` is **on** (Nuxt's default). A prior relaxation (`strictNullChecks: false`, held in the root `tsconfig.json`) was removed on 2026-08-11 during the tsconfig migration to Nuxt 4 project references — enabling it surfaced only three `array[index]` nullability flags in `web/utils/authRedirectLogic.ts`, all fixed in the same change.

## Scope

`package.json` (`typescript` pin, `vue-tsc`). No application code; no runtime behavior.

## Consequences

- `nuxt typecheck` stays green because the type-checker and TS version are known-compatible.
- The exact pin means TS patch/minor updates are taken deliberately, not automatically — a small manual step in exchange for avoiding a broken major.
- The hold is temporary: once vue-tsc supports TS 7, the pin should be lifted and this record superseded.

## Contracts Touched

- `project-summary.md` — ADR index row.
- Repo `package.json` carries the pin; this record keeps only the why.

## Open Questions

## Verification

Docs-only. Verified against the repo on 2026-08-04: `package.json` pins `typescript` `5.9.3` (exact) and `vue-tsc ^3.3.8`. `nuxt typecheck` is the type-check entry point in CI. (Strictness note updated 2026-08-11: `strictNullChecks` re-enabled.)
