# Experiment: Learned wait-time predictor cuts test flakiness

Worked reference example following `experiments/_template.md`. Fictional QA
automation platform — the same project the other examples describe. A
refuted experiment, kept for the finding.

## Status

Refuted

## Task Weight

Medium

## Hypothesis

Replacing fixed post-action waits with a learned per-step wait-time
predictor (features: action type, page weight, recent latency) reduces the
flaky-rerun rate by ≥ 25% versus the current fixed 500 ms wait.

## Success Bar

Flaky-rerun rate over the frozen 30-day replay of 4 000 recorded test runs
drops from the fixed-wait baseline by **≥ 25%**, with no increase in median
test wall-clock time. Bar fixed 2026-05-20, before any model was trained.

## Method

Offline replay harness over the frozen 4 000-run window (no live traffic).
Baseline: fixed 500 ms wait. Candidate: gradient-boosted predictor trained
on the first 20 days, evaluated on the last 10 (temporal split, no
leakage). Metric: flaky-rerun rate (a run that passed only on retry),
plus median wall-clock as the guardrail.

## Result

Flaky-rerun rate: baseline 8.1% → predictor 7.4% — a 9% relative drop,
short of the 25% bar. Median wall-clock unchanged. The predictor helped
only on render-bound steps; network-bound flakiness was untouched.

## Verdict

Refuted — the 9% improvement misses the 25% bar. Code disposition: the
replay harness is kept as research infrastructure (reused by later
experiments); the predictor model and its training path are reverted. The
finding stays.

## Finding

Test flakiness is dominated by backend/network response variance, not by
client-side wait timing — a wait predictor cannot reach it. Flakiness work
should target response-readiness signals (e.g. network-idle detection), not
smarter fixed-wait replacement.

## Domain Decisions

- "Flaky-rerun rate" is measured over a frozen replay window, never live
  traffic — keeps experiments comparable. (Candidate to graduate to the
  project register if later experiments reuse it.)

## Open Questions

## Dependencies

- `features/001_job_list_filtering.md`: the run history the replay
  window is sampled from.
