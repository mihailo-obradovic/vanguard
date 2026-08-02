# Workflow: Experiments

**Trigger:** work that is a falsifiable hypothesis measured against a bar (modeling, optimization, data science), not a capability to ship. A delivery project stays dormant here until the work is genuinely experimental.

The locked invariant is in the Flow Index (`prime-directive.md`). It reuses the delivery DNA (document first, user checkpoint, Same-Change Rule, validator) but inverts what success means: a well-run experiment that **refutes** its hypothesis is a success, and the finding is kept.

Each experiment is `experiments/<nnn>_<experiment>.md` from the template, with its own status set — `Proposed` → `Running` → `Adopted` / `Refuted` — separate from feature statuses, and a row in the Experiment Index of `project-summary.md`.

Size budget: target ≤4,800 characters — total characters, since line widths are not capped. Same budget as a decision record, and the same kind: a target and a note, not a hard maximum — only a feature is a contract others build against.

## Steps

1. Draft the hypothesis and the **Success Bar** — the threshold that decides the verdict, fixed _before_ the run and never moved after results are seen (Honest Inputs). Commit the `Proposed` document and its index row on `master`; the user approves the hypothesis and bar before any run — approving the bar is the gate, not approving a result.
2. On approval the status goes `Running`; build and measure on an `experiment/<nnn>-<slug>` branch. Record the measured Result as it came, no spin.
3. The verdict is Result against the pre-registered bar, not a judgement call: bar met → `Adopted`, bar missed → `Refuted`. State the code disposition (adopted graduates; refuted keeps or reverts the code) and write the one-line **Finding** either way.
4. `Adopted` **graduates**: the live change ships as a feature or decision record through the normal flow — the experiment does not become the contract. `Refuted` stays as knowledge: the record and its Index row are never deleted, so a later agent reads the finding instead of re-running the dead hypothesis. A local domain decision that proved cross-cutting graduates to the Domain Decisions register (`references/domain-decisions.md`).
