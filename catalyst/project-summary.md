# vanguard

Catalyst version: 0.16.0

## Project Purpose

Describe the project in one or two paragraphs. Be specific and concise, i.e. "This project provides <primary capability> for <primary users>. It focuses on <main business or technical goal> and integrates with <important systems>." Detailed specifications, when the project keeps them, live in `context/product-description.md`; a product that must align to a shared/umbrella brand also keeps `context/brand-description.md` (`references/context-documents.md`).

## Feature Index

| ### | Feature | Status | Summary | Document |
| --- | --- | --- | --- | --- |
| 000 | _No documented features yet._ | - | Add the first feature when behavior becomes durable. | - |

## Architecture Decision Record (ADR) Index

One line per record: type, status, title, link.

| ### | Type | Status | Decision | Document |
| --- | --- | --- | --- | --- |
| 000 | _No documented decisions yet._ | - | Add the first decision when behavior becomes durable. | - |

## Experiment Index

Present only in projects that run research/optimization work. Status carries the experiment's lifecycle, ending in the verdict (`Adopted` / `Refuted`). Finding is the one-line knowledge a later agent reads instead of re-running a dead hypothesis (`workflows/experiments.md`). Empty or absent for pure delivery projects.

| ### | Experiment | Hypothesis | Status | Finding | Document |
| --- | --- | --- | --- | --- | --- |
| 000 | _No documented experiments yet._ | - | - | - | - |

## Domain Decision Index

Present only when the project has standing, cross-cutting domain or method decisions that must stay visible and locked (e.g. "negative values are signal, never clipped"). Pre-resolved judgment calls the agent follows and does not re-litigate — distinct from decision records (architectural why, lazy-loaded) and Protected Areas (load-bearing contracts). One line each: the decision + short rationale. A local decision in a feature or experiment graduates here when it proves cross-cutting.

| Decision | Rationale |
| --- | --- |
| _No documented decisions yet._ | - |

## Protected Areas

Pointer index of protections declared in feature/decision documents (lazy-loaded, so they would otherwise be easy to miss). One row per area: name + owning document — never the rule text itself. Protections declared in folder documents are not indexed here; those documents are in context whenever their folder is worked on.

| Area | Owner |
| --- | --- |
| _No documented protected areas yet._ | - |

## Technical Stack

Every layer the project has and the module chosen for it (from Catalyst's `stacks/`), defaults included, plus UI choices, adopted addons, and any optional layer — the scaffolder fills this from the spawn choices, and it is what tells an agent which stack documents apply. See `architecture.md` for the index.

| Layer | Module |
| --- | --- |
| backend | laravel |
| backend/auth | sanctum-session |
| database | mysql |
| frontend | nuxt |
| frontend/ui | headless |
| maintenance | renovate |

## Status Values

Three separate sets — the validator rejects a row carrying another index's status.

**Features** (Feature Index):

- `Draft`: planned or partially specified; not yet approved.
- `Approved`: accepted as the contract; being implemented on a branch.
- `Active`: implemented and maintained.
- `Changing`: currently being redesigned or refactored.
- `Deprecated`: kept for compatibility but should not be expanded.
- `Removed`: intentionally removed; keep only if historical context matters.

**Decision records** (ADR Index): `Proposed` → `Accepted` → `Implemented`, plus `Superseded by <nnn>` when a later record replaces it.

**Experiments** (Experiment Index): `Proposed` → `Running` → `Adopted` / `Refuted`, the last two terminal.

## Summary Rules

Each feature summary should be:

- One to three sentences.
- Specific enough to route an agent to the right feature document.
- Free of implementation detail unless the implementation boundary matters.
- Updated when the feature's external purpose or behavior changes.

## Agent Usage

Agents should use this file to decide which feature documents and decision records are relevant. Agents should not recursively load the `features/` or `decisions/` directories.
