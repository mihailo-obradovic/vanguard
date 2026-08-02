# Prime Directive

Global rules for AI-assisted development, in thesis form: every line here is normative. This file is the always-loaded core — task classification, the everyday flows, and execution discipline. Rare, trigger-fired flows live one per file in `workflows/` (see Flow Index below); conditional document-type rules live in `references/`; both are loaded on demand, never preloaded. Prompt templates and the orientation diagram are in the Catalyst repository's `README.md` — for humans, never in the agent's startup load, and never copied into a project.

Paths in this file, and in every document beside it, are relative to the directory holding them. In the Catalyst repository that is the root; in a project it is `catalyst/` (Spawning Projects).

## Where Context Lives

### Context Loading

Start with: `AGENTS.md`/`CLAUDE.md`, `prime-directive.md`, `architecture.md` and `project-summary.md`. Nothing else is preloaded.

Load on demand:

- `features/<nnn>_<feature>.md` — when the user, task, branch, code path, failing test, or `project-summary.md` points to that feature. Never preload `features/`.
- `decisions/<nnn>_<type>_<decision>.md` — when the task touches what a record decided (same triggers as features). Never preload `decisions/`.
- `experiments/<nnn>_<experiment>.md` — when running or extending an experiment the Experiment Index points to. Never preload `experiments/`; the index in `project-summary.md` (statuses + findings) is the fast orientation.
- `workflows/<flow>.md` — the steps for a trigger-fired flow (Init Design, Bootstrap, Brownfield, Experiments, Incident, Parallel). Loaded when the Flow Index says the flow fires; the locked invariant is already in the Flow Index here. Never preloaded.
- `references/<topic>.md` — a conditional document-type rule: `references/operations-runbook.md`, `references/release-notes.md`, `references/domain-decisions.md`, `references/convention-annexes.md`, `references/folder-documents.md`, `references/context-documents.md`, `references/agent-skills.md`. Loaded when that document type applies to the project or task. Never preloaded.
- `conventions/<doc>.md` — an always-applied cross-cutting convention: `conventions/code-annotations.md`, `conventions/editor-setup.md`. Unlike a stack module these bind every project whatever its stack, and unlike a convention annex (`references/convention-annexes.md`) they are Catalyst's and arrive with the bundle. Loaded when the task matches the document's trigger. Never preloaded.
- `context/<doc>.md` — a context document: optional background depth behind the `project-summary.md` purpose thumbnail. Loaded when it exists in the project *and* the task matches its declared trigger; never preloaded, and never a behavior contract — when it disagrees with a feature document or `architecture.md`, the contract wins and the context document is updated to catch up, and when scope or identity changes the context document and the `project-summary.md` purpose paragraph change together. Rules and the full catalog: `references/context-documents.md`. Current documents:
  - `context/product-description.md` — product-shaping work: drafting or estimating a feature document, a product-motivated decision record, Init Design input-gathering, brownfield prioritization, an experiment's Success Bar or graduation, or a task touching product scope, phases, or priorities. Not Minor edits, Incident stabilization, Bootstrap, or Parallel execution.
  - `context/brand-description.md` — user-facing design work: UI feature drafting and browser verification, a frontend/UX decision record, the Init Design UI-module choice, or copy/voice/tone work. Kept only by a product that must align to a shared/umbrella brand it does not own; a standalone application relies on its design system (`stacks/frontend/*`) and keeps no such file.
- `operations.md` — the project's operator runbook, when operating live infrastructure (diagnosing, drilling, recovering), or when an infra change must update it (rules: `references/operations-runbook.md`). Never preloaded.
- `stacks/<layer>/…` — a module is a single `<module>.md` or a `<module>/` directory (nested choice dirs = follow-up questions, `addons/` = optional add-on docs, `rules/` = a per-rule payload). Load at init design when choosing a layer's module, or when a task changes one. Never preload `stacks/`; the project's Technical Stack table in `project-summary.md` says which modules and addons apply. Shared tiers — the underscore-prefixed dirs under `stacks/`, enumerated in `architecture.md` (Shared tiers) — travel automatically with the modules whose `**Requires:**` header names them and load like any stack doc; `rules/` files load per rule through the doc that routes them (a `performance.md` router, or the addon doc that owns the payload), never wholesale.
- `examples/<type>/…` — a worked sample of a document type, when its rules document points at one and the shape is not already clear. Illustrative only: never a contract, never copied verbatim, and never a source of project facts. Never preloaded.
- `versioning.md` — when releasing the template or setting a project's `Catalyst version` stamp. Never preloaded.
- Folder `CLAUDE.md`/`AGENTS.md` — read before working inside that folder, never preloaded (rules: `references/folder-documents.md`).

Relevant feature unclear → check `project-summary.md` first; still unclear → ask the user or proceed with the smallest safe context.

### Spawning Projects

A real project is spawned from the template with `python3 tools/new_project.py`: the scaffolder asks for a name and destination, asks which stack modules apply (one question per `stacks/` layer, with nested follow-up choices and optional addon picks), asks whether the project versions itself (its own `VERSION` + `CHANGELOG.md`; off by default), which `context/` documents to seed and which optional `tools/hooks/` to copy and activate, copies the rule set, and instantiates `project-summary.md` (project name, `Catalyst version` stamp from `VERSION`, Technical Stack rows). A fresh repository also gets the spawn commit on a new `master`. Day zero starts with Init Design (Flow Index).

- **The whole rule set lands in one directory, `catalyst/`.** The copies are byte-identical to the template's, so every path inside them keeps resolving — which is why paths in project documents are relative to `catalyst/`, not to the repository root. The spawn writes at the root only what a tool looks for there and nowhere else: `CLAUDE.md` and `AGENTS.md`, generated pointers into the bundle because agents read them there; the generated `.claude/skills/` wrappers — thin skill pointers into the bundle, regenerated on spawn and upgrade, never edited by hand (`references/agent-skills.md`); `.gitignore`, which is appended to; and the editor and toolchain setup, written once and the project's own from then on — `.editorconfig`, `.vscode/extensions.json` (`conventions/editor-setup.md`), plus `mise.toml` and the OXC configs `.oxlintrc.json`/`.oxfmtrc.json` for Node-based stacks (`stacks/_lang/typescript/toolchain.md`). The project's own `VERSION` and `CHANGELOG.md`, when it keeps them, are the product's and also stay at the root.
- The bundle holds the entry document (`AGENTS.md`), `prime-directive.md`, `architecture.md`, the instantiated `project-summary.md`, `versioning.md`, the three `_template.md` files (under `features/`, `decisions/`, `experiments/`, where the project's own numbered documents then live), `workflows/`, `references/`, `conventions/`, `examples/`, `tools/validate.py` + `tools/hooks/`, the chosen `context/` stubs, and only the chosen `stacks/` modules — each with its `rules/` payload, its chosen addons (plus their payload dirs), and the shared tiers its `**Requires:**` header names. Template meta (`TODO.md`, `CHANGELOG.md`, `COVERAGE.md`, `VERSION`, `README.md`, and `templates/` beyond the chosen stubs) never travels. The copy manifest is what enforces the invariant: a project must never reference Catalyst files its own repository does not contain.
- **Catalyst can be adopted into an existing repository**, not only a fresh one. The scaffolder detects a non-empty destination and turns additive: nothing is overwritten, existing `CLAUDE.md`/`AGENTS.md`/`.gitignore` gain a marked `catalyst:begin`/`catalyst:end` block and keep everything around it, no `README.md` is written, and git is left alone — no init, no commit — so the user reviews the diff and commits it themselves. Adopting the *codebase* that comes with it is a separate flow (`workflows/brownfield.md`).
- A project owns its context and its copy of the rules: `project-summary.md`, `features/` and `decisions/` (created from the copied templates), the `context/` documents it opted into (`references/context-documents.md`), and code. The copied `architecture.md` is the project's own from spawn onward and evolves through its decision records.
- Each project's `project-summary.md` carries a `Catalyst version: X.Y.Z` stamp — the Catalyst version its document shapes were last aligned to, initially the version it was built from (`versioning.md`). Upgrading is a deliberate act: read the newer Catalyst changelog entries, adopt what applies, bump the stamp — `tools/upgrade_project.py` (run from the Catalyst repo) automates this as a dry-run-first three-way merge (`versioning.md`); the stamp never auto-bumps, and a lagging stamp never blocks a commit (the validator emits a soft note when the stamp lags or is absent). This keeps version drift visible without retroactively rewriting untouched documents (which stay on the align-on-touch rule).
- Before any git operation, confirm which repo you are in (`git rev-parse --show-toplevel`): project work commits in that project's own repo, Catalyst changes in the Catalyst repo with a changelog entry and version bump.
- Unclear which project a task concerns → ask.

## Documents And Contracts

### Feature Documents

Every durable feature has `features/<nnn>_<feature>.md`, created from `features/_template.md` — a behavioral contract, not an implementation diary: purpose, inputs → outputs, business rules, edge cases, invariants, non-goals, entry points, dependencies, tests. Example-driven where behavior depends on input; no history notes, no prose duplicating code, no vague rules ("handle errors properly").

Required when: a feature is new; behavior grows complex enough to misread; a bug fix changes expected behavior; a refactor must preserve invariants. The document's Open Questions section holds unresolved items while drafting and must be empty at approval — resolve each or move it to Non-Goals (brownfield exception: `workflows/brownfield.md`).

Roles and accounts are a first-class contract dimension: a feature that introduces or changes roles or permissions carries an access matrix (resource/action × role) and a per-role experience walkthrough — what each account type sees at entry and which sections and actions it gets. Review is not complete until the user has confirmed both.

Size budget: target ≤9,600 characters, hard max 14,400 — total characters, since line widths are not capped. Over the max → split the feature, move exhaustive examples into tests, summarize implementation detail, or ask for an explicit exception.

### Architectural Decision Records (ADR)

`features/` documents what the system does; `decisions/` documents why it is built the way it is. A decision record covers architecturally significant work that does not change behavior contracts — typically infra, boundary-moving refactors, performance, upgrades, security hardening, tooling, bootstrap. The type is a free label; the trigger matters, not the taxonomy.

- Boundary test: would a feature document, API shape, or user-visible format need editing? Yes → feature workflow. No, but the work crosses services, moves boundaries, or touches infra or protected areas → decision record. Neither → plain maintenance, weight `Minor`.
- Worthiness test: write a record only when the choice was genuinely contested (real alternatives with real trade-offs), carries consequences a later change will trip over, or answers a "why is it like this?" that `architecture.md` and history cannot. A choice fully carried by an `architecture.md` line gets no record.
- Fixes are never decision records: a fix either restores documented behavior (the regression test is the artifact) or changes it (feature document update).
- Infra delivered inside a feature is documented by that feature — no separate record.
- Created from `decisions/_template.md` as `decisions/<nnn>_<type>_<decision>.md` (own numbering); target ≤4,800 characters. It records context, decision, scope, consequences, and verification, and points to the contracts it touched (`architecture.md`, feature and folder docs — updated in the same change). It never duplicates rules; contracts stay the single source of truth.
- A record runs through the Feature Workflow with the record as the document: statuses `Proposed` → `Accepted` (flipped on `master` at approval, Open Questions emptied) → `Implemented` map to the feature gates; the branch is `decision/<nnn>-<slug>`; the Verification section plays the Examples role as the acceptance evidence. `Superseded by <nnn>` when a later record replaces it. Worked sample: `examples/decisions/001_infra_request_tracing.md`.

### Project Summary

`project-summary.md` is the project's index (features and decisions) and safe startup context: the project purpose in a paragraph or two (linking its `context/` documents when they exist), then one row per feature — 1–3 sentence summary, status, link to the document. Full rules never live here. Statuses: `Draft` / `Approved` / `Active` / `Changing` / `Deprecated` / `Removed` (one ordered lifecycle — the feature's state and the document's gate on a single axis). Decision records get their own short index section (one line per record: type, status, title, link). It routes agents to documents; agents never scan `features/` or `decisions/` instead. Before changing shared code or behavior, scan this index for other features on the same code path and read them too — a change is not narrow if it silently breaks another feature's contract.

Two sections appear only when the project needs them (empty or absent otherwise): an **Experiment Index** (`workflows/experiments.md`) and a **Domain Decisions** register (`references/domain-decisions.md`); their shapes and rules live in the `project-summary.md` template itself.

Deprecating or removing a feature is feature work like any other: it gets the user's approval and its own branch, and in one change the behavior is retired, the document's status flips (with a one-line reason and, when another feature replaces it, a `Superseded by <nnn>` pointer), its tests are deleted or reassigned, and every feature that lists it as a dependency is updated. `Deprecated` behavior still works and stays tested until the `Removed` step actually deletes it; the document itself is never deleted — it stays as history.

### Protected Areas

Load-bearing contracts — public API routes and shapes, persisted enums and schema, output/report formats, tuned wrappers and prompts — may be declared in the root entry document, `architecture.md`, a folder document, or a feature/decision document. A declared area is `Hard` regardless of change size; never change it without explicit user agreement; state the impact before changing; update the matching document in the same change, noting migration or compatibility impact.

Visibility rule: root, architecture, and folder documents are in context whenever their area is worked on — but feature and decision documents are lazy-loaded, so a protection declared there can be missed. Every such protection therefore also gets one pointer row in the `Protected Areas` index of `project-summary.md` (area name + link to the owning document, added in the same change) — never the rule text itself; the owning document stays the single source of truth.

## How Work Runs

### Task Classification

Classify before working — first the kind, then the weight. Kind: bug fix when observed behavior contradicts a documented contract; experiment when the work is a falsifiable hypothesis measured against a bar (research, modeling, optimization) rather than a capability to ship (`workflows/experiments.md`); otherwise feature work, decision record, or plain maintenance, decided by the Decision Records boundary test — even when the user does not name it. Weight: `Minor` / `Easy` / `Medium` / `Hard`. `Minor` marks work that changes no durable behavior — all plain maintenance, a bug fix that restores documented behavior, a small local refactor; feature, decision-record, and experiment work is never `Minor`.

- `Minor` — no durable behavior change (typos, formatting, mechanical renames, narrow config). No plan, no brainstorming, no feature document, no `project-summary.md` row; smallest scoped change + narrow verification. If durable behavior surfaces mid-task → stop, switch to the feature workflow.
- `Easy` — make the change directly: without planning (no Plan mode, no brainstorming), but never without its kind's gate — `Easy` feature work keeps its feature document and the user's approval before implementation; an `Easy` bug fix keeps its root cause, investigation, and regression test (Bug Fixes).
- `Medium` — regular Plan mode before implementation.
- `Hard` — brainstorming when a plugin/skill is installed, else a more detailed Plan mode.

Not provided → estimate the smallest safe classification and confirm: `I estimate this is <feature|decision-record|experiment|bug-fix> work, weight <Minor|Easy|Medium|Hard>. Do you agree?` — or, for plain maintenance: `I estimate this is Minor work. Do you agree?` Provided explicitly → use it without re-asking. Risk unclear → `Medium`.

An explicitly requested feature (e.g. a prompt starting `feature: <name>`) always gets its own new numbered feature document — never an amendment to an existing document — even when the change could plausibly extend an existing feature's contract. The user names capabilities deliberately; the agent does not fold them away.

### Tool Routing

Plan mode and brainstorming are the baseline; hosts often install richer pipelines — guided feature-development flows with exploration, architecture, and review agents, e.g. Claude Code's `feature-dev` plugin. Whatever is installed, the weights route the same way: `Minor` and `Easy` use no pipeline (`Minor` has no planning at all; `Easy` goes straight to implementation behind its document gate); `Medium` uses regular planning — Plan mode, or a guided pipeline whose early phases draft the feature document; `Hard` adds brainstorming and deeper exploration. The adopting repository's entry document (`AGENTS.md`/`CLAUDE.md`) records the concrete mapping for its installed tools.

A project also carries generated `.claude/skills/` wrappers — thin pointers into the bundle's stack docs (`references/agent-skills.md`). The bundle documents and the project's convention annexes win over generic guidance from installed plugins or similarly-named third-party skills; the wrappers are regenerated on spawn and upgrade, so guidance changes go into the bundle documents, never into a wrapper.

Two constraints hold on every route:

- The feature document (or decision record) is the durable artifact, whichever tool drafts it, and its approval is the gate that starts implementation — a pipeline's own approval step (e.g. picking an architecture approach) never replaces document approval.
- `architecture.md` and protected areas are fixed contracts: exploration and architecture agents propose options *within* them, never alternatives *to* them, and review agents receive the feature document as the contract to review against.

### Feature Workflow

New feature:

1. Estimate the weight and confirm it (unless provided).
2. Create the feature document from the template (next free zero-padded number), with the weight's planning depth.
3. Add a `Draft` row to `project-summary.md`.
4. The user reviews the document. No implementation before approval; on approval its Status flips from `Draft` to `Approved` on the `master` branch, then work moves to a feature branch.
5. After approval implement narrowly, add or update tests that prove behavior (not tests that mirror implementation). Before calling the work done: walk the Examples table row by row — every row needs a test or a verification step that proves it; re-read the document and remove any drift; report the verification (what ran, the results, remaining risks) and record it in the document's Verification section (2–5 lines) before the status flips to `Active` — the evidence must outlive the chat. A UI feature is verified in a real browser when a browser-automation tool is available — named default Playwright MCP (`@playwright/mcp`), configured as an MCP server; any equivalent tool counts. The Examples table is the checklist, walked live, not just unit-tested; close the browser once the walk is done — leave no session open for whoever uses the tool next. With no such tool, the unseen UI is reported as a risk, never claimed working.

Existing feature change: find the document via `project-summary.md`; read it; preserve documented invariants unless the user changes the requirement; update tests and the document in the same change; touch `project-summary.md` only if the external summary changed. Missing doc updates = unfinished work.

Implementing a supplied document: if it does not follow the template, propose a document refactor first; implement only after the user accepts the document as the contract.

### Bug Fixes

No fix without a root cause. Reproduce or gather evidence first; read the matching feature document when documented behavior is affected; add a regression test when practical; ship the smallest root-cause fix, no unrelated refactors. A fix that changes intended behavior updates the feature document in the same change (never a decision record — see Decision Records). `Minor`/`Easy` fixes skip planning but never skip investigation or verification. A fix is `Minor` only when intended durable behavior does not change.

A **live system users depend on** that is down or materially broken splits from fixing: stabilize first, then fix. That is Incident Response — see the Flow Index.

### Refactors

Preserve documented behavior unless the user explicitly changes it: read the feature document first, identify invariants and examples, add characterization tests when important behavior is untested, keep changes aligned with `architecture.md`, and never hide behavior changes inside a refactor. Kind routing: a boundary-moving or cross-cutting refactor is decision-record work (type `refactor`); a small local one is `Minor` — these rules hold either way.

### Flow Index

Rare, trigger-fired flows live one per file in `workflows/`, loaded only when the flow fires — the everyday Feature / Bug Fix / Refactor / Minor flows stay above. Each row's **locked invariant is normative and always in context here**; the steps are in the linked file, read on demand.

| Flow | Fires when | Locked invariant (normative) | Steps |
| --- | --- | --- | --- |
| Init Design | project start, or a system first brought under the prime directive | one umbrella decision record before any bootstrap or feature work; covers day zero only | [workflows/init-design.md](workflows/init-design.md) |
| Bootstrap | one-time scaffold of a service or app | no feature document — `architecture.md` is the contract; the reviewed plan is a decision record (type `bootstrap`); weight `Medium` or `Hard`, never `Minor` | [workflows/bootstrap.md](workflows/bootstrap.md) |
| Brownfield Adoption | adopting the prime directive on an existing codebase | documents written from observed behavior, never intention; a retro-documented feature is `Active` on creation; honest gaps recorded, not smoothed | [workflows/brownfield.md](workflows/brownfield.md) |
| Experiments | a falsifiable hypothesis measured against a bar, not a capability to ship | the Success Bar is fixed before the run and never moved after results; a refute is a success and the finding is kept; the record is never deleted; adopted graduates and does not become the contract | [workflows/experiments.md](workflows/experiments.md) |
| Incident Response | a live system users depend on is down, corrupted, or breached | stabilize first with no diagnosis (rollback or switch-off — not a fix); a pre-cause hotfix ships only with explicit approval and is recorded as debt; every incident leaves an `incident` decision record | [workflows/incident.md](workflows/incident.md) |
| Parallel Feature Work | two or more separately approved features implemented together | drafting is always sequential; check independence (no shared protected areas or files) before parallelizing; one worktree per branch; the second merge resolves migration ordering | [workflows/parallel.md](workflows/parallel.md) |

## Execution Discipline

### Same-Change Rule

A behavior change and its feature document change together — same change, same commit when the project uses git. A dependency change that needs approval carries its `architecture.md` update in the same change (Dependency Change Rule, `architecture.md`, decides which do). Without the documentation update the task is not complete.

### Honest Inputs

Never fabricate data to make code run. When a schema, token, credential, or data source is missing or unclear, stop and ask — or fetch a real sample — before writing against it; never assume an integration behaves as documented without checking. This generalizes the bug-fix "never guess" (Bug Fixes) to every task that touches data or integration.

Where placeholder or synthetic data is genuinely unavoidable to make progress, it is flagged loudly at runtime (not silent) and recorded with a removal plan. A project carrying such data keeps a register of it (`KNOWN_FAKES.md`: what is fake, why, how it is removed); a project with no fabricated data has no such file. The register is a consequence of this rule, never a standing requirement.

### Document Validation

Before any commit that touches documents, run the validator and resolve findings in the same change: `python3 tools/validate.py` in the Catalyst repo, `python3 catalyst/tools/validate.py .` from a project's root. What it checks and how is the script's own contract (see its docstring). Only documents new or changed in the working tree are held to the current template — an untouched older document is aligned the next time it is substantively edited, never retroactively (`--all` audits everything). The hooks in `tools/hooks/` are the user's to activate (`sh catalyst/tools/hooks/install.sh` in a project, `sh tools/hooks/install.sh` in the Catalyst repo, or the scaffolder's offer at spawn time); agents never install or configure them — they call the validator directly.

### Feature Branches

Feature work (`Easy`/`Medium`/`Hard`), decision-record work, experiment work, and non-`Minor` bug fixes run on their own branch: `feature/<nnn>-<slug>`, `decision/<nnn>-<slug>`, `experiment/<nnn>-<slug>`, or `fix/<slug>`.

- Commit the draft document (feature, decision record, or experiment) and its `project-summary.md` row on the `master` branch before branching — this reserves the number and keeps the index authoritative. The approval flip (`Draft` → `Approved`, `Proposed` → `Accepted`) lands there too, before the branch exists.
- All implementation commits, doc updates, and the remaining status flips happen on the branch; merge back only after verification passes (fast-forward is fine); delete the merged branch. Unmerged work is not done — and finished, verified work is merged promptly: a done branch left sitting drifts from `master` and misleads the parallel independence check.
- `master` stays green: verified and usable at every point. If it breaks anyway, fixing or reverting it outranks all other work, and nothing new merges onto a red `master`; return to the interrupted task only after `master` is green again.
- Commits are logical units with messages that say what and why; history that has left the machine is never rewritten.
- `Minor` maintenance commits directly to the `master` branch.

Implementing two or more separately approved features together is Parallel Feature Work — see the Flow Index.

## Quality

### Review Standard

Reviewing agent work checks: code satisfies the feature document or decision record; documented behavior did not change accidentally; every Examples row is covered and important edge cases are tested; protected areas are untouched without explicit agreement; no architecture drift; new dependencies user-approved and allowed by `architecture.md`; error handling, data consistency, and security hold; documentation still matches the code. Reviews lead with defects and regressions, not praise; surface risks and unclear requirements before broad changes, not after.
