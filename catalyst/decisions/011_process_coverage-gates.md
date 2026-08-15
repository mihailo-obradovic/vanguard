# Decision: Coverage stays measured, never gated

## Status

Proposed

## Type

process

## Task Weight

Easy

## Context

Decision 008 made coverage measured-not-gated and attached an explicit precondition to revisiting that: "neither enforces a threshold while recorded gaps remain open — a gate over a known-incomplete suite teaches testing what is cheap. Revisit gating after gap closure."

That precondition is now met. The frontend's recorded non-deliberate gaps closed over 2026-08-13..15 — the data layer, the app shell and plugins, the components, and finally the three auth dialogs. What remains untested is deliberate and recorded per file in `operations.md`. The backend has been at 100% lines throughout. The revisit is therefore due, and this record answers it rather than deferring it again.

## Decision

Coverage stays a measurement. No threshold gates CI — not now, and not as a consequence of the gaps closing. Three reasons, in order of weight:

- **The deliberate exclusions make a project-wide threshold dishonest.** `pages/` at 0% is _correct_ here — 008 hands it to the live browser walk — so any global number has to be tuned around a figure that is right. A threshold calibrated to accommodate a correct exclusion has stopped measuring anything.
- **008's objection outlives its own precondition.** "A gate over a known-incomplete suite teaches testing what is cheap" reads as an argument about incompleteness, but the mechanism is Goodhart's law and it applies to a complete suite too. `conventions/testing.md` already says the mutation score is "a measurement, never a target"; the same holds for coverage the moment a build fails on it.
- **Nothing is regressing.** CI prints both numbers on every push, and `operations.md` now carries a per-file tested / deliberately-untested decision, so a drop is legible in review instead of invisible.

Rejected, but the closest call: **a per-directory floor** on the layers that are genuinely contracts (`web/utils`, `services`, `stores`, `composables` — all at or near 100%), with no project-wide number at all. It avoids the dishonest-threshold problem and would catch a silent drop in the data layer. It is not adopted because at this size it buys little that review does not already do, and it adds a second place where the deliberate exclusions must be kept in sync. It is the first thing to reconsider if the trigger below fires.

## Scope

This record, a pointer in 008, and the ADR index. No CI change, no config change, no code. The mutation audits are untouched — 009 forbids gating those, and that stands.

## Consequences

- The gating question is settled rather than perpetually deferred: 008's "revisit after gap closure" no longer reads as an open action item.
- Protection against regression stays human — the per-file register in `operations.md`, the periodic mutation audit, and review of the numbers CI already prints. This is a genuine acceptance of risk: nothing mechanical stops coverage sliding.
- **Revisit trigger**, so this is not a permanent no: a coverage or mutation regression that review demonstrably missed, or the project gaining a second regular contributor. Either makes the per-directory floor the first option to reconsider, and needs its own record.

## Contracts Touched

- `decisions/008` — pointer at the gating clause this record answers; 008 stays authoritative for everything else.
- `project-summary.md` — ADR index row.
- `operations.md` — none. The runbook records how to run the measurements, not the policy governing them.

## Open Questions

## Verification

No behavior change and no code, so there is nothing to test — the record is the deliverable; the Catalyst validator and oxfmt are clean. The figures it rests on were measured on the merged tree rather than estimated: frontend coverage 54.79% statements on `master` and 77.35% on `variant/vuetify`; backend 100% lines; mutation 92.76% (master frontend), 82.98% (variant frontend), 82.06% (backend).
