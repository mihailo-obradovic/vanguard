# AGENTS.md

Canonical agent guidance for the **Catalyst** template. This is the single source of truth for how AI agents (and humans) should work in this repository and in any project spawned from it. Root documents are global rules, and everything else is loaded on demand.

## File Index

The following table is the file index; the fuller load triggers live in `prime-directive.md` (Context Loading).

| File | Description | Load |
| --- | --- | --- |
| `prime-directive.md` | Global rules (weights, workflows, review standard) | Mandatory |
| `architecture.md` | System shape, stack, protected areas | Mandatory |
| `project-summary.md` | Feature + decision index and project purpose | Mandatory |
| `features/<nnn>_<feature>.md` | Feature contracts (what the system does) | On demand — when the task points to it (user, branch, code path, or `project-summary.md`) |
| `decisions/<nnn>_<type>_<decision>.md` | ADRs (why the system is built this way) | On demand — when the task points to it (user, branch, code path, or `project-summary.md`) |
| `experiments/<nnn>_<experiment>.md` | Research experiments (falsifiable hypothesis + verdict) | On demand — when running/extending an experiment; the Experiment Index in `project-summary.md` is the fast orientation |
| `stacks/<layer>/…` | Per-layer stack modules, chosen at spawn or init design — a module is a single `<module>.md` or a `<module>/` directory (nested choice dirs = follow-up questions, `addons/` = optional add-on docs with optional payload dirs, `rules/` = per-rule payloads loaded via their router doc); underscore-prefixed shared tiers (`architecture.md`, Shared tiers) travel with the modules that require them | On demand — at init design when choosing a layer's module, or when a task changes one; the project's Technical Stack table says which apply |
| `conventions/<doc>.md` | Always-applied cross-cutting conventions — bind every project regardless of stack (code annotations, editor setup) | On demand — when the task matches the document's trigger |
| `tools/` | Validator (`validate.py`) and optional git hooks (`hooks/`, activated by the user with `hooks/install.sh`); in the Catalyst repo also the scaffolder (`new_project.py`), the upgrader (`upgrade_project.py`), and the upstream rule sync (`sync_rules.py`) — never copied into spawns | Never loaded as context — invoked (`python3 tools/<script>.py`, `sh tools/hooks/install.sh`) |
| `examples/<type>/…` | Worked sample documents (decision records, experiment, operations runbook) — illustrative only, never contracts | On demand — when writing a document type whose rules point at its sample |
| `context/<doc>.md` | Optional context documents — background depth behind the purpose (e.g. `product-description`, `brand-description`) | On demand — when the document exists in the project and the task matches its trigger (`references/context-documents.md`); never a contract |
| `operations.md` | Operator runbook (Operate / Recovery / Quirks per component) | On demand — when operating live infrastructure, or when an infra change must update it |
| `versioning.md` | How the template is versioned + how to release | On demand — when releasing or setting a project's `Catalyst version` |
| `workflows/<flow>.md` | Steps for trigger-fired flows | On demand — when the Flow Index says a flow fires (init design, bootstrap, brownfield, experiments, incident, parallel) |
| `references/<topic>.md` | Conditional document-type rules | On demand — when that document type applies (operations runbook, release notes, domain decisions, convention annexes, folder docs, context documents, agent skills) |
| folder `CLAUDE.md`/`AGENTS.md` | Folder orientation map | On demand — before working inside that folder |

Every path above is relative to the directory holding this file. In the Catalyst repository that is the root; in a project the whole set sits in `catalyst/`, and the root keeps the generated `CLAUDE.md`/`AGENTS.md` pointers into it, alongside the editor and toolchain files their tools read there (prime directive: Spawning Projects). Those pointers are generated — the block between `catalyst:begin` and `catalyst:end` is rewritten on upgrade, so edit this file rather than them. The project root also carries generated `.claude/skills/` wrappers — thin skill pointers into the bundle's stack docs, regenerated on spawn and upgrade (`references/agent-skills.md`); guidance changes go into the bundle documents, never into a wrapper.

Projects are spawned from this template with `python3 tools/new_project.py`, into a new repository or an existing one — it copies the rule set into `catalyst/`, records stack choices, and stamps the `Catalyst version`. For project work read that project's own `project-summary.md` and use its `features/`, `decisions/`, and `context/`; the root `project-summary.md` is only the template with writing guidance — it holds no real project context. Catalyst's own meta — `TODO.md`, `CHANGELOG.md`, `COVERAGE.md`, `VERSION`, `README.md`, and `templates/` (the source of the `context/` stubs) — stays in the template repository and is absent from every spawn, which is why the index above does not carry it. Before any git operation, confirm which repo you are in (`git rev-parse --show-toplevel`): project work commits in the project repo, Catalyst changes in the Catalyst repo.

## Non-Negotiables

- No implementation before the user approves the feature document or the decision record.
- Behavior and its documentation change in the same change — same commit — when git is used (Same-Change Rule).
- Feature and decision work runs on its own `feature/<nnn>-<slug>` / `decision/<nnn>-<slug>` branch; the draft document is committed on `master` first; merge back only after verification.
- No bug fix without a root cause: reproduce or gather evidence first — never guess. Production firefighting is the exception that is not a fix: rolling back or switching a feature off restores a known-good state and does not wait for a cause (`workflows/incident.md`).
- Never fabricate data to make code run: missing or unclear schema, token, or source → stop and ask; unavoidable placeholder data is flagged loudly and recorded (Honest Inputs, prime directive).
- Documented protected areas are `Hard`: never change them without explicit user agreement; state the impact first.
- A dependency the stack modules in use do not already allow needs the user's approval and an `architecture.md` update in the same change (Dependency Change Rule, `architecture.md`).
- Follow the established architecture and style; keep changes narrow; never hide behavior changes in refactors.

Task weights, workflows, parallel work, and the review standard live in `prime-directive.md`.
