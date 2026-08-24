# Branch Sync

**Trigger:** syncing this variant branch from `master` — before the merge, and again while resolving it. The _why_ is in `decisions/010_ui_vuetify-variant.md`; this document is the procedure.

Master is the source; this branch is a **variant** (`context/domain-glossary.md`) — synced from master, never merged back.

## What syncs, by path

Decided by path, not by reading each diff:

| Path                                                                        | Resolution                                                                                                                          |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `web/composables/`, `web/services/`, `web/utils/`, `catalyst/stacks/`       | **Master wins.** Framework-agnostic; this is the layer the sync exists to carry.                                                    |
| `web/pages/`, `web/layouts/`, `web/components/`, `web/assets/`, `web/i18n/` | **Variant wins**, always, including a file this branch has deleted (the four auth pages — auth lives in the layout's dialogs here). |
| `web/CLAUDE.md`, `catalyst/operations.md`, `catalyst/features/*`            | **By hand.** Both branches hold real content, and these describe both.                                                              |

## Three things the table does not catch

- **Master-only UI files arrive as clean additions**, not conflicts — git has nothing on this branch to compare them against. They are deleted in the merge commit (the 2026-08-17 sync deleted 14: the `UI*`/`AuthCard`/badge primitives, `ProfileFormDialog`, `UserGqlFormDialog` and their specs). Left in, they would be unreferenced components styled against master's tokens, with specs that run and pad this branch's coverage and mutation figures. Every later master commit touching one of those paths raises a modify/delete conflict, resolved as _delete_ each time — that friction is the signal, not a defect.
- **A shared document can auto-merge into a lie.** `features/002` and `007` took master's entry-point edits cleanly in the 2026-08-17 sync and pointed this branch at components it does not have. Read every `catalyst/features/*` diff after the merge, conflicted or not.
- **A bundle document this branch carries and master does not never arrives by merge at all** — `stacks/frontend/nuxt/ui/vuetify/` is master's blind spot. A Catalyst release that changes one reaches this branch only through `tools/upgrade_project.py`, run here. And the merge brings master's bumped `Catalyst version` stamp, which the upgrader reads: it reports "already on vX.Y.Z — nothing to do" while these documents sit a version behind. Set the stamp back to what this branch actually holds, run the upgrader, let it bump. Hit on 1.8.0, whose one Changed entry was `ui/vuetify/components.md`.

A change genuinely wanted in both UI layers is ported deliberately, as its own commit on each branch. It is never a merge resolution.

## The run

1. Merge `master`, resolving by the path table.
2. Delete the master-only UI files the merge added.
3. Read the shared-document diffs — `catalyst/features/*`, `catalyst/operations.md` — conflicted or not. Project-mode `validate.py` does not resolve document paths, so nothing else will catch a pointer to a file this branch lacks.
4. If the Catalyst stamp moved in the merge, reset it and run the upgrader — this branch always carries ui documents master lacks.
5. Suites, then commit.
