# Vanguard — project instructions

## To-do list (Workflowy)

The Workflowy MCP server is connected and acts as the task tracker for this project.

- **The to-do list is the Workflowy node `Home → Work → Vanguard`** (node id `5a55338a-20d1-0ab4-8cbe-3d075daaf161`). Treat this node and its descendants as the single source of truth for project tasks.
- Scope: for this project, "the to-do list" always means that node. Do not treat other parts of the Workflowy tree as project tasks.
- When I say something like **"let's tackle X from the to-do list"**, look up task X under the Vanguard node (search/get within that id), then work on it.
- **When a task is finished, mark it complete in Workflowy** (`workflowy_complete` on that node's id). Don't delete it.
- Tasks may carry inline hashtags like `#high-priority`, `#back-end`, `#full-stack`, `#lowpriority`; completed/older items live under the `#archive` child.

<!-- catalyst:begin -->

## Catalyst

Agent guidance for this repository lives in `catalyst/`. Read `catalyst/AGENTS.md` first — it is the file index and says which documents load when.

Mandatory on every task: `catalyst/prime-directive.md`, `catalyst/architecture.md`, `catalyst/project-summary.md`.

Paths inside those documents are relative to `catalyst/`, not to this root.

This block is generated — edit `catalyst/AGENTS.md` instead. Anything outside the markers is yours and is never touched.
<!-- catalyst:end -->

## Agent skills

Configuration for the `mattpocock-skills` engineering pipeline, run **inside** Catalyst governance (decision record: `catalyst/decisions/012_tooling_mattpocock-skills-integration.md`). All of its config lives in the Catalyst bundle — **there is no `docs/agents/`, no root `CONTEXT.md`, and no `docs/adr/` in this repo**; when a skill hardcodes one of those paths, use the paths below instead.

### Issue tracker

Workflowy — the to-do list node above is the tracker; tickets are child nodes, body in the note, done via `workflowy_complete`. See `catalyst/agents/issue-tracker.md`.

### Triage labels

The five canonical roles map to inline hashtags (`#needs-triage`, `#needs-info`, `#ready-for-agent`, `#ready-for-human`, `#wontfix`). See `catalyst/agents/triage-labels.md`.

### Domain docs

Single-context. Glossary: `catalyst/context/domain-glossary.md`; ADRs: `catalyst/decisions/` (Catalyst template and flow); specs: `catalyst/features/`. See `catalyst/agents/domain.md`.

### Tool routing (Catalyst → skills)

The concrete mapping Catalyst's Tool Routing asks the entry document to record. On any conflict, Catalyst discipline wins.

| Situation (Catalyst term)                     | Skill route                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Hard` feature/decision work                  | `/grill-with-docs` is the brainstorming step (this repo uses it over `superpowers:brainstorming` — it is stateful: glossary + Catalyst ADRs). Its output feeds drafting the **Catalyst feature document / decision record** — that document is the durable artifact and its approval is the implementation gate. `/to-spec` output takes the Catalyst template shape, never a parallel spec format. |
| `Medium` work                                 | Regular Plan mode, per `prime-directive.md`; `/grill-with-docs` is optional, not required.                                                                                                                                                                                                                                                                                                          |
| Multi-session build (after document approval) | `/to-tickets` → agent-ready Workflowy child nodes; `/implement` per ticket, `/clear` between tickets.                                                                                                                                                                                                                                                                                               |
| Any `/implement` run                          | Drives `/tdd` internally, but commits follow Catalyst **Implementing A Plan**: one step at a time, stop for the user's approval of every commit — this overrides the skill's own commit/close-out behavior. `/code-review`'s Spec axis receives the feature document or decision record as the contract; its Standards axis applies the Catalyst Review Standard.                                   |
| Bug fix                                       | `/diagnosing-bugs` (this repo uses it over `superpowers:systematic-debugging`) — its feedback-loop-first, regression-test discipline serves Catalyst's "no fix without a root cause". A live system users depend on routes to Catalyst `workflows/incident.md` first: stabilize before diagnosis.                                                                                                   |
| Fog-of-war efforts                            | `/wayfinder` (map node conventions: `catalyst/agents/issue-tracker.md`); decision tickets that turn out contested and consequential become Catalyst decision records; the map hands off at `/to-spec` as usual.                                                                                                                                                                                     |
| Upkeep                                        | `/improve-codebase-architecture` findings enter as _ideas_, then get classified per Task Classification like any other work.                                                                                                                                                                                                                                                                        |
| Always                                        | `catalyst/architecture.md` and protected areas are fixed contracts for every skill; Workflowy stays the single task source of truth; `python3 catalyst/tools/validate.py .` runs before any commit that touches documents.                                                                                                                                                                          |
