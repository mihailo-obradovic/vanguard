# Decision: Init design — Vanguard brownfield stack

## Status

Implemented

## Type

init-design

## Task Weight

Medium

## Context

Backfilled at the brownfield adoption of Catalyst 0.16.0 (2026-08-02) onto a running system: Vanguard, a full-stack starter with a Laravel 13 JSON API and a Nuxt 4 SPA in one repository. The stack choices predate this record — they were made across the repo's history (through July 2026) and are documented here from observed behavior per `workflows/brownfield.md`, not designed fresh. Vanguard is also the reference implementation the Catalyst nuxt/laravel modules were authored from.

## Decision

The de-facto module set, confirmed against the running system:

- **backend = laravel** (swap from default `python-fastapi`) — PHP 8.3, Laravel ^13.8, Pest 5.
- **frontend = nuxt** (swap from default `nextjs`) — Nuxt ^4.5, Vue 3, pnpm-only.
- **database = mysql** (swap from default `postgres`) — `.env` `DB_CONNECTION=mysql`, host-local server, no containerization.
- **backend/auth = sanctum-session** (module default confirmed) — stateful SPA cookie auth, JSON-only responses, no guest redirects.
- **frontend/ui = headless** (module default confirmed) — no component library on `master`; the Vuetify variant lives on the `variant/vuetify` branch and gets its own record when adopted there.

Default-set layers **not adopted**:

- **workers**: `celery` is a Python-stack tool; async work (queued notifications) runs on Laravel's built-in queue with the database driver, inside the backend module — no separate worker deployable exists.
- **deployment**: no deployment story ships today — an honest gap, not a choice of `docker-compose`. Adopting one later is its own record.

Optional layers walked in order:

| Layer                    | Verdict     | Why                                                                                                                             |
| ------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Identity (`keycloak`)    | not adopted | two roles (admin/user) carried by Laravel auth + `app/Enums/Role.php`; no federation or external IdP need                       |
| Maintenance (`renovate`) | **adopted** | already live — `.github/renovate.json` plus active `renovate/*` branches; committed lockfiles are what the layer exists to move |

Addons: `ssr` not adopted — the app is a deliberate SPA (`nuxt.config.ts` sets `ssr: false`); the underlying rationale is a B-phase backfill record of its own. `framework-mapping` not adopted.

## Scope

Design only — this record plus the Technical Stack annotation, Project Purpose, and ADR index row in `project-summary.md`, and the Protected Areas section in `architecture.md`. No code changes; behavior contracts untouched.

## Consequences

The bundle's stack documents now govern the named layers. Known interim duplication stands until the cleanup session: root `CLAUDE.md` prose (Pinia Colada / Regle rules) and the `vue-styling-guide.md` / `.cursor/` / `.github/instructions/` copies overlap the bundle docs. The deployment gap stands. Upgrades flow via `upgrade_project.py` against the `v0.16.0` release tag. Retro feature contracts (session auth, user CRUD, profile, data layer, validation UX) follow per `workflows/brownfield.md` steps 3–5.

## Contracts Touched

- `project-summary.md` — Technical Stack rows (scaffolder-filled) and annotation, Project Purpose, ADR index row pointing here.
- `architecture.md` — Protected Areas section (public API surface, session/auth contract, DB schema), declared in the same change.

## Open Questions

## Verification

Docs-only change: `python3 catalyst/tools/validate.py .` green. Stack claims cross-checked against the running system at `master@b6572d5`: `.env` `DB_CONNECTION`, `composer.json` / `package.json` versions, `nuxt.config.ts` `ssr: false`, `.github/renovate.json` present, route surface in `routes/api.php` / `routes/web.php`. Existing test suites untouched.
