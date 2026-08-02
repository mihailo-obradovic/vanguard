# Experiment: <hypothesis short name>

An experiment is a falsifiable question, not a contract. Unlike a feature (which must work), an experiment succeeds when it gives an honest answer — a well-run experiment that **refutes** its hypothesis is a success, and the finding is kept. It is a point-in-time probe, not a durable invariant.

Expected file name: `experiments/<nnn>_<experiment>.md` (own numbering). The record is never deleted: a refuted experiment stays as knowledge (`workflows/experiments.md`).

Size budget: target ≤4,800 characters — total characters, since line widths are not capped.

## Status

Proposed

Allowed values: `Proposed` (hypothesis + bar written, awaiting approval to run — no run yet), `Running` (approved; being built and measured), `Adopted` (bar met; graduates to a feature/decision record), `Refuted` (bar not met; kept as knowledge). Adopted/Refuted are terminal — the verdict.

## Task Weight

Medium

Allowed values: `Easy` / `Medium` / `Hard` — workflow per weight is defined in `prime-directive.md` (Task Classification).

## Hypothesis

The falsifiable claim, specific and measurable. Name what changes and the direction and size of the expected effect.

> Adding <X> reduces <metric> by ≥ <n>% versus <baseline>.

## Success Bar

The threshold that decides Adopted vs Refuted, **fixed before the run and never moved after results are seen** (Honest Inputs, prime directive). State the metric, the comparison baseline, and the exact number. Moving this bar after seeing results invalidates the experiment.

## Method

How the hypothesis is measured: the evaluation setup, the baseline compared against, the data or holdout, the metric. This is measurement design, not correctness tests.

## Result

Empty until the run completes. Then: the measured numbers, against the bar. No narrative spin — the numbers as they came.

## Verdict

Filled at the gate: `Adopted` or `Refuted`, by comparing Result to the Success Bar. State the code disposition explicitly:

- `Adopted` — graduates: the live change ships as a feature or decision record (this experiment does not become the contract).
- `Refuted` — the record stays as knowledge; the experimental code is either kept as research infrastructure or reverted, stated here. Either way the finding survives.

## Finding

What was learned, stated as knowledge — especially on a refute. This is the point of the experiment: the one durable sentence a later agent reads instead of re-running the dead hypothesis.

## Domain Decisions

Local domain decisions this experiment rests on (carried into the feature if adopted). A decision that turns out to govern many experiments graduates to the project's Domain Decision Index (`project-summary.md`), where it is locked and not re-litigated.

## Open Questions

Unresolved items while `Proposed`. Empty before approval to run.

- <open question>

## Dependencies

Features, data sources, or earlier experiments this one builds on.

- `<dependency>`: <why it matters>
