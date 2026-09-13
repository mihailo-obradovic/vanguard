# Branch Sync

**Trigger:** syncing this variant branch from `master` — before the merge, and again while resolving it.

Master is the source; this branch is a **variant** (`context/domain-glossary.md`) — synced from master, never merged back. Its UI is a rewrite on shadcn-vue rather than a variation of master's, so a sync is decided by path, not by reading each diff on its merits.

## What syncs, by path

| Path                                                                                                                                                                                                                                                                                                   | Resolution                                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `web/composables/`, `web/services/`, `web/utils/`, `web/stores/`, `web/plugins/`, `web/types/`, `web/mocks/`, `catalyst/stacks/` — except the rows below                                                                                                                                               | **Master wins.** Framework-agnostic; this is the layer the sync exists to carry. The composables only this branch has (`useConfirmOnEnter`, `useDialogForm`, `useFieldAria`, `useMutationDialog`) are additions master never touches.    |
| `web/pages/`, `web/layouts/`, `web/components/` (vendored `ui/` included), `web/assets/`, `web/lib/`, `web/app.vue`, `web/error.vue`, `web/spa-loading-template.html`, `web/utils/authRedirectLogic.ts` and its spec, `web/middleware/auth.global.ts`, `components.json`, `.claude/skills/shadcn-vue/` | **Variant wins**, always, including a file this branch has deleted (`login`, `register` and `forgot-password` — auth lives in the layout's dialogs here, which is also why the redirect policy and its middleware differ from master's). |
| `web/i18n/`, `web/CLAUDE.md`, `README.md`, `nuxt.config.ts`, `package.json`, `.oxfmtrc.json`, `catalyst/architecture.md`, `catalyst/operations.md`, `catalyst/project-summary.md`, `catalyst/features/*`, `catalyst/context/domain-glossary.md`                                                        | **By hand.** Both branches hold real content. The catalogs keep this branch's keys and take master's new ones — master-owned code in `utils/` reads them too.                                                                            |
| `pnpm-lock.yaml`                                                                                                                                                                                                                                                                                       | **Never hand-merged.** Take this branch's side, run `pnpm install` against the merged `package.json`, and commit the lockfile it writes.                                                                                                 |

A change genuinely wanted in more than one UI layer is ported deliberately, as its own commit on each branch. It is never a merge resolution.

## Three things the table does not catch

- **Master-only UI files arrive as clean additions**, not conflicts — git has nothing here to compare them against. Delete them in the merge commit: left in, they are unreferenced components styled against master's tokens, with specs that run and pad this branch's coverage. A later master commit touching one of master's UI primitives this branch deleted raises a modify/delete conflict; resolve it as _delete_ each time.
- **A shared document can auto-merge into a lie.** A `catalyst/features/*` entry point or a `web/CLAUDE.md` line can take master's edit cleanly and point at a component this branch does not have. Read every such diff after the merge, conflicted or not.
- **A bundle document this branch carries and master does not never arrives by merge** — `stacks/frontend/nuxt/ui/shadcn-vue/` is master's blind spot. A Catalyst release that changes one reaches this branch only through `tools/upgrade_project.py`, run here; and when the merge brings master's bumped `Catalyst version` stamp, the upgrader reports nothing to do while those documents sit a version behind. Set the stamp back to what this branch holds, run the upgrader, let it bump.

## The run

1. Merge `master`, resolving by the path table.
2. Delete the master-only UI files the merge added.
3. Read the shared-document diffs — `catalyst/features/*`, `catalyst/operations.md`, `web/CLAUDE.md` — conflicted or not. Project-mode `validate.py` does not resolve document paths, so nothing else catches a pointer to a file this branch lacks.
4. If the Catalyst stamp moved in the merge, reset it and run the upgrader.
5. `pnpm install`, then lint, format check, typecheck, the suite and `validate.py`; walk the app in both colour faces; then commit.
