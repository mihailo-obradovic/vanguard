# Testing Quality

**Trigger:** writing, changing, or reviewing any test, on every project — before the stack testing module, which holds the per-stack mechanics.

The universal rules for what makes a test worth keeping. Framework follows Khorikov (_Unit Testing: Principles, Practices, and Patterns_); the stack modules (`stacks/backend/laravel/testing.md`, `stacks/frontend/nuxt/testing.md`) bind these rules to their tools and never restate them.

## Purpose

A test suite exists to keep the cost of change flat as the codebase grows. A test is an asset only while its value exceeds its maintenance cost; one that must be edited every time the code is restructured is a liability — fix it or delete it. Coverage is read accordingly (`decisions/008`): low coverage is evidence of a problem, high coverage is evidence of nothing, and no test is ever added just to move the number. Every test must be able to answer: _what regression does this catch, and what refactor would falsely break it?_

## The four pillars

Judge every test on: **regression protection** (how much meaningful code it executes), **resistance to refactoring** (how rarely it fails when behavior is unchanged — non-negotiable), **fast feedback**, and **maintainability**. The first two multiply — a test scoring zero on either is worth zero. Refactor resistance being fixed at maximum, the only real trade-off is protection vs speed, which is why the suite is a pyramid: many fast narrow tests, fewer integration tests, a handful of end-to-end journeys.

## The central rule

**Test observable behavior, never implementation details.** Observable behavior is the public API a client uses to reach a goal; everything else is internal.

- If a test fails during a behavior-preserving refactor, **the test is defective** — fix the test, never bend the code.
- Never test private methods. Logic unreachable through a public API is dead code or a hidden abstraction that should become its own unit.
- Never change production code purely to enable a test — no visibility widening, no hooks, no `isTest` branches, no test-only endpoints.

## A unit is a unit of behavior

One test may exercise several classes; that is correct. Isolate tests **from each other** (no shared mutable state, no order dependency) — not each class from its collaborators. In-process collaborators are used for real, never mocked; feeling the need to partial-mock a class means it has two responsibilities and should be split.

## Boundaries: managed vs unmanaged

Classify every out-of-process dependency:

- **Managed** — fully yours, invisible from outside (your database, storage, cache): **use the real thing.** Its contents are implementation details; mocking it is forbidden. Integration tests run against the same engine as production (Universal Rule, `architecture.md`).
- **Unmanaged** — observable from outside (SMTP, third-party HTTP APIs, message buses others consume — and, from the SPA's side, the backend API): **mock it at the outermost boundary and assert on the interaction**, because those calls _are_ observable behavior.

Never assert on a stub — a double that only supplies input is not a contract, and verifying it was called is over-specification.

## Test styles, in order of preference

1. **Output-based** — input in, return value asserted, no side effects. Preferred wherever possible.
2. **State-based** — act, then assert the resulting state.
3. **Communication-based** — assert on calls. Only at unmanaged boundaries.

Structure code as a functional core in an imperative shell so output-based testing stays available: pure decision logic with no I/O, wrapped thinly by the layer that performs it. The `authRedirectLogic` extraction (`stacks/frontend/nuxt/routing.md`) is this repo's worked example.

## What to test

By complexity × collaborator count: **complex logic with few collaborators** (domain rules, algorithms) → unit test thoroughly, the highest ROI in the suite. **Trivial code** → don't test. **Complex logic tangled with many collaborators** → refactor into the other two cells first; an elaborate mock-heavy test is never the fix. **Orchestration** (controllers, wiring) → integration test through the real entry point.

## Structure

- **Arrange–Act–Assert, one act per test.** Two acts is two tests, or an integration test in disguise.
- **No conditionals, loops, or try/catch in a test** — branching logic in a test means the test needs a test.
- **Hardcode expected values.** Recomputing the expectation with production logic asserts nothing.
- **Names are behavior sentences** a non-programmer could read (`a password change fails with the wrong current password`), never `method_state_result` encodings.
- **Fixtures come from factory helpers** with sensible defaults and explicit overrides for every value the test asserts on; no shared mutable fixtures in base classes or global hooks. A test reads top to bottom without jumping to other files.

## Prohibitions

No ambient time in domain logic (inject a clock or pass time in). No randomness in assertions unless the property is genuinely universal. No sleeping — wait on conditions. No asserting on logs, ORM query counts, CSS classes, or framework internals. No tests for the framework's own behavior.

## Proving a test can fail

Green only means something if the test could have been red. Three tiers, cheapest first:

1. **Regression tests fail before the fix** — prime-directive law, restated here only to complete the list.
2. **Sabotage spot-check** — for an after-the-fact test with non-trivial setup (notification callbacks, transport plumbing), briefly break the code or flip the assertion, confirm red, restore. Judgment call; pointless for one-line pure assertions.
3. **Mutation testing as a periodic audit** — the automated version of tier 2: mutate the code, rerun the suite, and every _surviving mutant_ is a change no test noticed. Backend: Infection; frontend: Stryker once the data-layer tests exist. Run per the operations runbook, triage every survivor (fix the test or record why the mutant is acceptable), no CI gate — like coverage, it is a measurement, not a target.

## End-to-end tests

When a project adopts them (the trigger lives in the stack module): nothing faked except sandboxed paid third parties, real build against a real backend and database, and only the few journeys whose breakage costs most — single digits, not dozens. A business rule that only an E2E test covers is a rule in the wrong layer.
