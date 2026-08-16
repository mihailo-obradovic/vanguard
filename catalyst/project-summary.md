# vanguard

Catalyst version: 1.5.0

## Project Purpose

Vanguard is a full-stack starter pairing a Laravel 13 JSON API with a Nuxt 4 SPA in one repository. It ships session-based Sanctum authentication (Breeze-style endpoints), admin-gated user CRUD with role-based access, self-service profile management, and a cookie-consent banner. The data-layer and validation conventions it exists to demonstrate — Pinia Colada two-layer services and Regle + Zod — have their own demonstration feature contracts (005, 006) alongside the stack modules that hold their rules. It is the reference implementation for Catalyst's nuxt + laravel pairing, and doubles as an experimental testbed for the optimal Laravel + Nuxt setup across UI-library variants. Product vision, audience, and priorities live in `context/product-description.md`.

Context documents: `context/product-description.md`, `context/domain-glossary.md` (`references/context-documents.md`)

## Feature Index

| ### | Feature              | Status | Summary                                                                                                                                                                    | Document                                                                     |
| --- | -------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 001 | Session Auth Flow    | Active | Sanctum stateful cookie auth for the SPA: register/login/logout, `GET /api/user`, CSRF flow, auth store, boot plugin and route guarding.                                   | [features/001_session-auth.md](features/001_session-auth.md)                 |
| 002 | User Management      | Active | Admin-gated user CRUD behind the `admin` middleware: list/create/update/hard-delete, two-role RBAC (`user`/`admin`), self-delete guard.                                    | [features/002_user-management.md](features/002_user-management.md)           |
| 003 | Self-Service Profile | Active | `PUT /api/profile`: own name/email/password updates; email change resets verification; `current_password` challenge; role untouchable.                                     | [features/003_self-service-profile.md](features/003_self-service-profile.md) |
| 004 | Cookie Consent       | Active | Accept/decline banner (`web/app.vue`) persisting a `cookie_consent` cookie for a year; consent recorded but not yet gating anything.                                       | [features/004_cookie-consent.md](features/004_cookie-consent.md)             |
| 005 | Client Data Layer    | Active | Demonstration contract: two-layer `services` → `queries` composables (Pinia Colada), one fetcher, Zod response parsing, central error routing.                             | [features/005_client-data-layer.md](features/005_client-data-layer.md)       |
| 006 | Form Validation UX   | Active | Demonstration contract: Regle rules mirror the backend, Zod validates responses only, server 422s bridge to inline field errors (no toast).                                | [features/006_form-validation-ux.md](features/006_form-validation-ux.md)     |
| 007 | GraphQL API          | Active | Demonstration contract: a Lighthouse `/graphql` endpoint (users query + updateUser mutation) and the client wrappers that make a GraphQL call cost what a REST call costs. | [features/007_graphql-api.md](features/007_graphql-api.md)                   |
| 008 | Email Availability   | Active | Public `GET /api/email-availability` + a debounced async Regle rule: "already taken" while typing, failing open so the backend `unique` rules stay authoritative.          | [features/008_email-availability.md](features/008_email-availability.md)     |
| 009 | Email Verification & Password Reset | Active | The mail-driven lifecycle around the session: forgot/reset password, the signed verification link and its resend, and the SPA pages that drive them.  | [features/009_email-verification-password-reset.md](features/009_email-verification-password-reset.md) |

## Architecture Decision Record (ADR) Index

One line per record: type, status, title, link.

| ### | Type        | Status      | Decision                                                            | Document                                                                                             |
| --- | ----------- | ----------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 001 | init-design | Implemented | Init design — Vanguard brownfield stack                             | [decisions/001_init-design_vanguard-stack.md](decisions/001_init-design_vanguard-stack.md)           |
| 002 | infra       | Implemented | Sanctum session-cookie auth for the SPA pairing (over token mode)   | [decisions/002_infra_sanctum-session-spa.md](decisions/002_infra_sanctum-session-spa.md)             |
| 003 | tooling     | Implemented | oxlint + oxfmt for the frontend toolchain (over ESLint + Prettier)  | [decisions/003_tooling_oxlint-oxfmt.md](decisions/003_tooling_oxlint-oxfmt.md)                       |
| 004 | tooling     | Implemented | Hold TypeScript at 5.9.x (TS 7 unsupported by vue-tsc)              | [decisions/004_tooling_typescript-version-hold.md](decisions/004_tooling_typescript-version-hold.md) |
| 005 | infra       | Implemented | Client-only SPA (`ssr: false`), paired with cookie-session auth     | [decisions/005_infra_spa-no-ssr.md](decisions/005_infra_spa-no-ssr.md)                               |
| 006 | infra       | Accepted    | Adopt the i18n addon (`@nuxtjs/i18n`) with en / sr-Latn / sr-Cyrl   | [decisions/006_infra_i18n-adoption.md](decisions/006_infra_i18n-adoption.md)                         |
| 007 | infra       | Implemented | Serve GraphQL alongside REST (Lighthouse + a fetcher-based client)  | [decisions/007_infra_graphql-alongside-rest.md](decisions/007_infra_graphql-alongside-rest.md)       |
| 012 | tooling     | Implemented | mattpocock-skills run inside Catalyst structures (Workflowy tracker, single ADR home, glossary as context doc) | [decisions/012_tooling_mattpocock-skills-integration.md](decisions/012_tooling_mattpocock-skills-integration.md) |
| 013 | process     | Implemented | Testing rulebook: strategy, quality doctrine, mutation and coverage stance in one record (supersedes 008/009/011, deleted) | [decisions/013_process_testing-rulebook.md](decisions/013_process_testing-rulebook.md)               |

## Domain Decision Index

Present only when the project has standing, cross-cutting domain or method decisions that must stay visible and locked (e.g. "negative values are signal, never clipped"). Pre-resolved judgment calls the agent follows and does not re-litigate — distinct from decision records (architectural why, lazy-loaded) and Protected Areas (load-bearing contracts). One line each: the decision + short rationale. A local decision in a feature or experiment graduates here when it proves cross-cutting.

| Decision                                                                                             | Rationale                                                                                              |
| ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Feature documents carry the current contract only — no history, dates, commit hashes, or retro-narration | Git holds the history; the repo is a template base, so a document must read as the contract it is today |
| Superseded decision records are deleted, not kept — the superseding record and git history hold the why    | Same template-base reasoning; `Superseded by <nnn>` stays available for a record genuinely worth keeping |
| Document numbers are never reused or compacted — holes are expected under delete-at-supersession           | A number is a stable identifier across branches, git history, and the tracker; compacting breaks every reference to it |

## Protected Areas

Pointer index of protections declared in feature/decision documents (lazy-loaded, so they would otherwise be easy to miss). One row per area: name + owning document — never the rule text itself. Protections declared in folder documents are not indexed here; those documents are in context whenever their folder is worked on.

| Area                                                                       | Owner                                |
| -------------------------------------------------------------------------- | ------------------------------------ |
| Session mechanics + register/login/logout and `GET /api/user`              | features/001_session-auth.md         |
| Forgot/reset password, verification link and resend endpoints              | features/009_email-verification-password-reset.md |
| User management API (`apiResource` users)                                  | features/002_user-management.md      |
| Profile endpoint (`PUT /api/profile`)                                      | features/003_self-service-profile.md |
| GraphQL schema + `/graphql` endpoint                                       | features/007_graphql-api.md          |

## Technical Stack

Every layer the project has and the module chosen for it (from Catalyst's `stacks/`), defaults included, plus UI choices, adopted addons, and any optional layer — the scaffolder fills this from the spawn choices, and it is what tells an agent which stack documents apply. See `architecture.md` for the index.

| Layer           | Module          |
| --------------- | --------------- |
| backend         | laravel         |
| backend/auth    | sanctum-session |
| database        | mysql           |
| frontend        | nuxt            |
| frontend/ui     | headless        |
| frontend/addons | i18n            |
| maintenance     | renovate        |

Assembled at brownfield adoption — swaps from the default set and non-adopted default layers are recorded in `decisions/001_init-design_vanguard-stack.md`.

**i18n locale set:** `en` (source, authored first) · `sr-Latn` · `sr-Cyrl`. Serbian is authored in Latin and transliterated to Cyrillic; plain `sr` / `sr-RS` resolve to `sr-Latn`. Adopted in `decisions/006_infra_i18n-adoption.md`.

**GraphQL:** served alongside REST by `nuwave/lighthouse` on the backend and a `gqlFetcher` built on the project's own fetcher on the frontend — no GraphQL client library, no stack module yet. Adopted in `decisions/007_infra_graphql-alongside-rest.md`; the contract is `features/007_graphql-api.md`. Porting it to Catalyst as opt-in `graphql` addons for the `laravel` and `nuxt` modules is a follow-up.

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

## Summary Rules

Each feature summary should be:

- One to three sentences.
- Specific enough to route an agent to the right feature document.
- Free of implementation detail unless the implementation boundary matters.
- Updated when the feature's external purpose or behavior changes.

## Agent Usage

Agents should use this file to decide which feature documents and decision records are relevant. Agents should not recursively load the `features/` or `decisions/` directories.
