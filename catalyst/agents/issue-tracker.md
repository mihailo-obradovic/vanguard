# Issue tracker: Workflowy

Issues for this repo live as nodes under the Workflowy node **`Home → Work → Vanguard`** (id `5a55338a-20d1-0ab4-8cbe-3d075daaf161`), reached through the `workflowy_*` MCP tools. That node is the project's single source of truth for tasks (`AGENTS.md`); these conventions layer the engineering skills' issue vocabulary onto it — there is no second tracker.

## Conventions

- **One feature per node**: a child of the Vanguard node named after the feature, e.g. `feature 009: <name>`. Its Catalyst feature document (`catalyst/features/<nnn>_*.md`) is the spec — never duplicate the spec into Workflowy; the node's note links the document path.
- **Implementation issues are one child node per ticket** under the feature node, numbered from `01` in the name (`01 <slug>`), never a single combined list item.
- **Ticket body lives in the node's note** (`workflowy_update` with `note`): goal, acceptance criteria, files touched, and any context the agent needs to work self-contained.
- **Triage state** is an inline hashtag in the node name (see `triage-labels.md`). Priority/area hashtags already in use (`#high-priority`, `#back-end`, `#full-stack`, `#lowpriority`) coexist untouched.
- **Blocking**: sibling order is the default execution order; an explicit dependency is a `blocked-by: NN[, NN]` line at the top of the note. A ticket is unblocked when every ticket it lists is complete.
- **Done** = `workflowy_complete` on the node — never delete. Older/archived items live under the `#archive` child; leave them alone.
- Tickets produced by `/to-tickets` are already agent-ready — never triage them.

## When a skill says "publish to the issue tracker"

`workflowy_create` a child node in the right place (feature node for tickets, the Vanguard node for a new feature/effort), name per the conventions above, body in the note.

## When a skill says "fetch the relevant ticket"

`workflowy_get`/`workflowy_search` within the Vanguard node id; the user will normally name the task or feature. Read the node's note as the issue body.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a node with one **child** node per ticket.

- **Map**: a child node of the Vanguard node named `map: <effort>`; the Notes / Decisions-so-far / Fog body lives in its note.
- **Child ticket**: `NN <slug>` under the map node, numbered from `01`, question in the note, plus `type: research|prototype|grilling|task` and `status: claimed|resolved` lines.
- **Blocking**: a `blocked-by: NN[, NN]` note line; unblocked when every listed ticket is `resolved`.
- **Frontier**: list the map node's children; open, unblocked, unclaimed — first by number wins.
- **Claim**: set `status: claimed` in the note before any work.
- **Resolve**: append the answer under an `## Answer` heading in the note, set `status: resolved`, then append a context pointer (gist) to Decisions-so-far in the map node's note.

## PRs as a request surface

Off. External pull requests are not part of the triage queue.
