# Product Description

A **context document** (`references/context-documents.md`): background depth behind the one-paragraph purpose in `project-summary.md`. It records product vision and intent — _not_ behavior. It is never a contract: when it disagrees with a feature document or `architecture.md`, the contract wins and this file is updated to catch up. Keep it scannable; trim to what shapes decisions and link out for the rest.

**Loads when:** product-shaping work — drafting or estimating a feature document, a product-motivated decision record, Init Design input-gathering, brownfield prioritization, an experiment's Success Bar or graduation, or any task touching product scope, phases, or priorities.

## Vision

Vanguard is a full-stack starter pairing a Laravel 13 JSON API with a Nuxt 4 SPA, built to be the trusted baseline you start a new app from instead of a blank skeleton. It serves three intents at once:

- **Catalyst reference implementation** — the canonical nuxt + laravel project the Catalyst stack modules are authored and kept honest against (`decisions/001_init-design_vanguard-stack.md`).
- **Personal project starter** — a clone-and-go base that ships working auth, user management, and the frontend conventions so a new project reaches its first real feature fast.
- **Experimental testbed and convention showcase** — where the optimal Laravel + Nuxt setup is discovered and demonstrated (data layer, validation, error handling, auth), and where the same core is proven across multiple UI ecosystems on parallel branches.

## Users

A single maintainer today, wearing three hats — the document describes those roles, not separate people or tenants:

- **Module author** — treats Vanguard as ground truth that keeps the Catalyst stack modules matching real, running code.
- **Project spawner** — clones the pairing (or a UI variant) to begin a new app and expects auth + conventions to work unchanged.
- **Convention learner** — reads it as a worked example of the patterns worth copying.

Not a public multi-tenant product; there are no end-user personas beyond `user`/`admin` in the demo app itself.

## Scope And Non-Goals

In scope:

- A complete-but-minimal identity core: session-based Sanctum auth, admin-gated user CRUD, self-service profile, cookie consent (features 001–004).
- The demonstrated frontend conventions: two-layer data layer and Regle + Zod validation with central error handling (features 005–006).
- Multiple UI variants of the same core on parallel branches, so the conventions are shown across component ecosystems — see Key Integrations for current vs. planned.

Non-goals:

- **Deployment / hosting** — no deploy story ships today; an acknowledged gap, not a choice (`decisions/001`). Adopting one is its own record.
- **SSR** — deliberately a client-only SPA (`decisions/005_infra_spa-no-ssr.md`); server rendering would force revisiting the cookie-auth model.
- **Rich domain features** — anything beyond the identity baseline. Vanguard is a starting point, not a destination product.
- **Authorization beyond two roles** — `user`/`admin` only; no policies or fine-grained permissions.

## Phases And Priorities

The **prioritized backlog is the source of truth in Workflowy** (`Home → Work → Vanguard`, per the root `CLAUDE.md`), tagged by priority and area — this table is intent, not the task list, and should not be kept in lockstep with it.

| Phase            | Focus                                                             | Priority       |
| ---------------- | ----------------------------------------------------------------- | -------------- |
| Identity core    | Auth, user management, profile, consent — the load-bearing base   | must (shipped) |
| Convention layer | Data layer + validation UX as reusable, documented patterns       | must (shipped) |
| UI variants      | Prove the core across UI ecosystems (headless done; more planned) | should         |
| Test coverage    | Close the recorded frontend/backend test gaps                     | should         |
| Deployment story | Fill the acknowledged deploy gap                                  | later          |

## Key Integrations

- **Catalyst template/bundle** — Vanguard is spawned and upgraded through it (`tools/`), and its stack modules are authored from this repo; the relationship is bidirectional and the tightest coupling the project has.
- **UI component ecosystems** — the variant strategy targets headless, Vuetify, NuxtUI, ShadCN, and PrimeUI. Live today: **headless** (`master`, the CSS-agnostic base) and **Vuetify** (`variant/vuetify`). NuxtUI, ShadCN, and PrimeUI are intended variants, not yet branched.
- **Infrastructure** — MySQL (sessions + queue), queued mail (MailTrap in dev), and Renovate for lockfile/image maintenance (`decisions/001`).

## Success Signals

- A project spawned from this pairing inherits working auth and the frontend conventions with **no rework**.
- The Catalyst stack modules **stay in sync** with what the code actually does — docs match the running system, and gaps are recorded rather than hidden.
- **Short time from clone to first real feature.**
- Maintained, working UI variant branches exist across the targeted ecosystems (headless and Vuetify today; NuxtUI, ShadCN, PrimeUI as they land).
