# versioning.md

How the **Catalyst template** is versioned. The current number lives in `VERSION`; each project records a `Catalyst version` stamp in its `project-summary.md` — the Catalyst version its document shapes were last aligned to, initially the version it was built from. The scaffolder (`tools/new_project.py`) writes the stamp at spawn from `VERSION`.

Two distinct things are versioned, and this file governs the first:

- **The Catalyst stamp — mandatory.** Every spawned project gets it, and it is what `tools/upgrade_project.py` reads (it refuses to run without one). Not optional, never asked about.
- **The project's own version — optional, off by default.** A spawned project only gets its own `VERSION` and `CHANGELOG.md` when asked for at spawn (`--versioning`), for versioning the product being built. Its numbering is the project's business, unrelated to the stamp. The `post-commit` hook's `catalyst-requires: versioning` means *this*, not the stamp.

## The number

SemVer (`MAJOR.MINOR.PATCH`):

- **MAJOR** — a rule changed in a way that could break existing projects.
- **MINOR** — something new was added (a doc, workflow, stack).
- **PATCH** — fixes and wording, no rule change.

We're at `0.x` while the template is still taking shape; cut `1.0.0` when it's stable. A project on an older version reads Catalyst's `CHANGELOG.md` before adopting newer behavior (the changelog stays in Catalyst — it never travels into spawns).

## Upgrading a project

From the Catalyst repo: `python3 tools/upgrade_project.py <project-path>` — dry-run by default, `--apply` writes. It prints the changelog between the project's stamp and the current version, three-way merges the copied rule files in the project's `catalyst/` (project-local edits are preserved; real conflicts get markers to resolve), reports — but never touches — project-owned documents (`architecture.md`, `project-summary.md` content), offers any hooks new in the target version (`tools/hooks/README.md`), refreshes the generated root pointers, and bumps the stamp only after confirmation. It reads spawn-time file contents from the release tags below; without the project's base tag it degrades to `.catalyst-new` sidecar files instead of overwriting.

The merge base is read by the template's own paths, which do not move when a project's do — Catalyst's root *is* the bundle layout, so a project's `catalyst/<path>` and the template's `<path>` are the same file.

## Releasing

Releasing the **template**, in the Catalyst repository. Every file named below (`TODO.md`, `CHANGELOG.md`, `VERSION`, `tools/sync_rules.py`) is template meta that never travels — a project reading this section has none of them, and its own `VERSION`/`CHANGELOG.md`, if it keeps them, version the product instead.

1. Remove from `TODO.md` every item the release finished, and correct the ones it moved. The list only stays honest if pruning happens here rather than from memory.
2. Dry-run `python3 tools/sync_rules.py` against upstream; if rules drifted, apply and fold the sync into the release (its own changelog line). Needs network — when offline, skip and note it, don't block the release.
3. Move `CHANGELOG.md`'s `Unreleased` items under a new `## [X.Y.Z] - <date>` heading.
4. Set `VERSION` to `X.Y.Z`.
5. Commit, then tag `vX.Y.Z` — the tag is load-bearing: the upgrader reads spawn-time file contents from it.

Step 5's tag can be automatic: `tools/hooks/post-commit` tags any `master` commit that changes `VERSION`, and `post-merge` does the same for a release that arrives by merge or pull. It is optional and per clone — activate it with `sh tools/hooks/install.sh` (see `tools/hooks/README.md`). It only creates the tag locally; pushing it (`git push --tags`) stays a deliberate act.

Template build-out runs on `enhancement/<topic>-<date>` branches, landed step by step and merged into `master` when the topic is done; the changelog entry is the record — pre-1.0 the template keeps no feature or decision documents for its own changes. The branch classes in `prime-directive.md` (Branches) govern projects built with Catalyst, not Catalyst itself.
