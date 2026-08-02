# Decision: Sanctum session-cookie auth for the SPA pairing

## Status

Implemented

## Type

infra

## Task Weight

Medium

## Context

Backfilled at brownfield adoption (2026-08-02); the decision itself dates to **2026-07-28**, when the backend was recreated on a fresh Laravel 13 skeleton (`9df6b43`), CORS and environment were configured for the Nuxt SPA (`c174669`), and Sanctum SPA cookie authentication landed (`b857a34`) — transport first, auth mechanism 17 minutes later. Sanctum offers two independent modes: stateful cookie sessions and bearer tokens. One had to carry the SPA.

## Decision

**Sanctum's stateful cookie mode, paired with a deliberate SPA (`ssr: false`)** — the two choices justify each other and were made together.

Session mode: the browser holds an HttpOnly session cookie; CSRF is double-submitted (`/sanctum/csrf-cookie` priming, `X-XSRF-TOKEN` header, one 419 retry); sessions live in the database; login/logout return `204` and rotate/invalidate the session server-side. Nothing client-side stores a credential.

Rejected: **token mode** (`sanctum-token`, the alternative module choice). It would put a bearer credential in browser storage (XSS-exfiltratable, unlike an HttpOnly cookie), require a token body from `POST /login`, and discard the session machinery — while its real payoff (credential usable outside a browser cookie jar, e.g. an SSR/BFF server) buys nothing for a client-only SPA. The unused half ships as evidence: `personal_access_tokens` migration exists, `HasApiTokens` is on the model, and not one `createToken`/`Bearer` reference exists in PHP or the SPA.

The SPA half: cookie auth works because everything runs in the browser where the cookie jar lives — the fetcher sends `credentials: 'include'` unconditionally, reads `XSRF-TOKEN` via `useCookie`, and the awaited `auth-loader` boot round-trip assumes one client per browser session. Under SSR the server render has no cookie jar and this flow silently breaks; SSR adoption (the `ssr` addon) would force revisiting this record — token mode held server-side is the documented path.

## Scope

Design only at backfill — records the standing choice. The mechanics it locks are the protected session/auth contract owned by `features/001_session-auth.md`.

## Consequences

- Frontend and backend must agree on cookie plumbing: `SANCTUM_STATEFUL_DOMAINS=localhost:3000,localhost:3001`, `SESSION_DOMAIN=localhost`, `SameSite=lax`, credentialed CORS fed by `FRONTEND_URL`. Works because both origins share `localhost`; a production split across apex domains needs `SameSite=None; Secure`, which nothing sets yet — deployment-layer debt, standing.
- CSRF handling is client code (priming + 419 retry) that token mode would not need.
- The dormant `personal_access_tokens` table stays (harmless; removing it is a schema change under the DB protection).
- `guard => ['web']`, `statefulApi()`, and database sessions become load-bearing config — captured in feature 001.

## Contracts Touched

- `project-summary.md` — ADR index row.
- `features/001_session-auth.md` — owns the resulting behavior contract; this record keeps only the why.

## Open Questions

## Verification

Original: the auth test suite (now 16 tests) exercising session login/logout, regeneration, 401-JSON posture. At backfill: repo-wide grep confirms zero token-mode usage; config and fetcher mechanics verified line-by-line (2026-08-02); `php artisan test` 36 passed.
