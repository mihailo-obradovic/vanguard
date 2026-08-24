# Branch Sync

**Trigger:** syncing this variant branch from `master` — before the merge, and again while resolving it. The _why_ is in `decisions/014_ui_nuxtui-variant.md`; this document is the procedure.

Master is the source; this branch is a **variant** (`context/domain-glossary.md`) — synced from master, never merged back.

## What syncs, by path

Decided by path, not by reading each diff:

| Path                                                                                                                                | Resolution                                                                                                                                                |
| ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `web/composables/`, `web/services/`, `web/utils/`, `catalyst/stacks/`                                                               | **Master wins.** Framework-agnostic; this is the layer the sync exists to carry.                                                                          |
| `web/pages/`, `web/layouts/`, `web/components/`, `web/assets/`, `web/config/nuxt-ui/`, `web/i18n/`, `web/spa-loading-template.html` | **Variant wins**, always, including a file this branch has deleted (`login`, `register` and `forgot-password` — auth lives in the layout's dialogs here). |
| `web/CLAUDE.md`, `catalyst/operations.md`, `catalyst/features/*`                                                                    | **By hand.** Both branches hold real content, and these describe both.                                                                                    |

A change genuinely wanted in more than one UI layer is ported deliberately, as its own commit on each branch. It is never a merge resolution.

## Three things the table does not catch

- **Master-only UI files arrive as clean additions**, not conflicts — git has nothing on this branch to compare them against. They are deleted in the merge commit. Left in, they would be unreferenced components styled against master's tokens, with specs that run and pad this branch's coverage and mutation figures. Every later master commit touching one raises a modify/delete conflict, resolved as _delete_ each time — that friction is the signal, not a defect.
- **A shared document can auto-merge into a lie**, pointing this branch at components it does not have. Read every `catalyst/features/*` and `catalyst/operations.md` diff after the merge, conflicted or not. Project-mode `validate.py` does not resolve document paths, so nothing else will catch it.
- **A bundle document this branch carries and master does not never arrives by merge at all** — `stacks/frontend/nuxt/ui/nuxtui/` is master's blind spot the way `ui/vuetify/` is. A Catalyst release that changes one reaches this branch only through `tools/upgrade_project.py`, run here. And the merge brings master's bumped `Catalyst version` stamp, which the upgrader reads: it reports "already on vX.Y.Z — nothing to do" while the ui documents sit a version behind. Set the stamp back to what this branch actually holds, run the upgrader, let it bump.

## The run

1. Merge `master`, resolving by the path table.
2. Delete the master-only UI files the merge added.
3. Read the shared-document diffs — `catalyst/features/*`, `catalyst/operations.md` — conflicted or not.
4. If the Catalyst stamp moved in the merge and this branch carries ui documents master lacks, reset the stamp and run the upgrader.
5. Suites, then commit.
