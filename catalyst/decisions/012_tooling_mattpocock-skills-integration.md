# Decision: Integrate the mattpocock-skills pipeline under Catalyst governance

## Status

Implemented

## Type

tooling

## Task Weight

Easy

## Context

The `mattpocock-skills` plugin (v1.2.3) is installed in this repository's agent harness. It provides an idea-to-ship pipeline (`/grill-with-docs` → `/to-spec` → `/to-tickets` → `/implement`) plus `/triage`, `/diagnosing-bugs`, `/code-review`, `/tdd`, and `/domain-modeling`. Its `/setup-matt-pocock-skills` precondition expects per-repo configuration: an issue tracker, a triage label vocabulary, and a domain-doc layout, by default under `docs/agents/` with a root `CONTEXT.md` glossary and `docs/adr/` ADRs.

The project already runs under Catalyst, whose Tool Routing (`prime-directive.md`) anticipates installed pipelines: weights route the same way, and the repository's entry document records the concrete tool mapping. Left unconfigured, the skills would create a parallel governance surface — a second ADR home, a second spec format, and a third task location beside Workflowy.

## Decision

Configure the skills to run inside Catalyst's structures instead of beside them:

- **Issue tracker: Workflowy** (the existing source-of-truth node `Home → Work → Vanguard`), recorded as an "Other" tracker in `agents/issue-tracker.md`. Rejected: GitHub Issues (native label/blocking support, but splits the task source of truth) and local markdown under `.scratch/` (a third task location).
- **Single ADR system:** skills read and write `decisions/` using the Catalyst template, numbering, worthiness test, and `Proposed` → `Accepted` flow. No `docs/adr/`. Rejected: a second lightweight ADR tier (two homes for one document type).
- **Glossary as a context document:** `context/domain-glossary.md`, registered in the project's Context Loading list and `project-summary.md`, instead of a root `CONTEXT.md`. It is background vocabulary, never a contract.
- **Config lives in the bundle:** the three files the setup skill would scatter under `docs/agents/` live in a new project-owned directory `agents/` (`issue-tracker.md`, `triage-labels.md`, `domain.md`). The root `AGENTS.md` gains an `## Agent skills` section (outside the generated Catalyst markers) carrying the pointers and the Tool Routing mapping, and explicitly redirecting skills away from their hardcoded `docs/agents/`, root `CONTEXT.md`, and `docs/adr/` defaults.
- **Catalyst discipline wins on conflicts:** the feature document or decision record remains the durable spec (`/to-spec` output takes the Catalyst template shape); its approval remains the implementation gate; `/implement` follows Implementing A Plan (one step at a time, user approves every commit) over its own commit behavior; `/grill-with-docs` is the brainstorming step for `Hard` work; `/diagnosing-bugs` serves the bug-fix root-cause rule; a live-system incident routes to `workflows/incident.md` first.

## Scope

- New: `agents/issue-tracker.md`, `agents/triage-labels.md`, `agents/domain.md`, `context/domain-glossary.md`.
- Edited: `prime-directive.md` (one Context Loading bullet for the glossary), `project-summary.md` (Context documents line + this record's row), root `AGENTS.md` (new section outside the generated block).
- No behavior contracts touched; no application code.

## Consequences

- Skills and Catalyst share one ADR home, one spec format, and one task tracker; no drift between two governance systems.
- `agents/` and `context/domain-glossary.md` are project-local: the Catalyst upgrader never touches them and delivers no sidecars for them — expected, and this record is where that is remembered.
- A few skills hardcode `docs/agents/` and root-`CONTEXT.md` paths; the always-loaded `AGENTS.md` redirect outranks skill defaults, but a future plugin update may add new hardcoded paths — re-check the `## Agent skills` section when upgrading the plugin.
- Workflowy has no native labels or blocking links; triage roles map to inline hashtags and blocking is encoded by sibling order plus a `blocked-by:` note line, which agents must maintain by convention.

## Contracts Touched

- `project-summary.md` — ADR row and `Context documents:` line.
- `prime-directive.md` (project copy) — Context Loading bullet for `context/domain-glossary.md`.
- Root `AGENTS.md` — `## Agent skills` section (pointers + tool mapping), outside the generated markers.

## Open Questions

## Verification

- `python3 catalyst/tools/validate.py .` ran after each step: 0 errors, 0 notes throughout.
- Root `AGENTS.md` diff was insertions-only after the `catalyst:end` marker; the generated block stayed byte-identical.
- `workflowy_list` on node `5a55338a-20d1-0ab4-8cbe-3d075daaf161` resolved the live Vanguard task list (with its `#archive` child), confirming the tracker contract in `agents/issue-tracker.md` against the real tree.
