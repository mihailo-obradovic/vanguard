# Decision: Client-only SPA (ssr: false)

## Status

Implemented

## Type

infra

## Task Weight

Medium

## Context

Backfilled at brownfield adoption (2026-08-04). ADR 001 (addons) and ADR 002 both flag this as an owed record: Nuxt runs with `ssr: false` and the two auth choices — session-cookie Sanctum and client-only rendering — were made together and justify each other. This record writes down the rendering half.

## Decision

**Run Nuxt as a client-only SPA (`nuxt.config.ts` sets `ssr: false`).** All rendering and data fetching happen in the browser, where the session cookie jar lives; the app boots, primes the CSRF cookie, and rehydrates the user from `GET /api/user` on the client.

This is the paired half of ADR 002 (Sanctum stateful cookie auth). Cookie auth works precisely because everything runs in the browser: the fetcher sends `credentials: 'include'` unconditionally and reads `XSRF-TOKEN` client-side. Under SSR the server render has no cookie jar and this flow silently breaks — so adopting SSR (the `ssr` addon) would force revisiting ADR 002, with server-held token mode as the documented path.

## Scope

`nuxt.config.ts` (`ssr: false`) and the client-only assumptions baked into the auth boot flow (`auth-loader` plugin, fetcher). No API shapes or feature behavior change here — the resulting auth behavior is owned by feature 001.

## Consequences

- No server render: simpler deploy (static/client bundle, no Node render tier) and a straightforward cookie-auth story, at the cost of SEO/first-paint that SSR would give.
- SSR is not a drop-in later — it is coupled to the auth model (ADR 002) and would require moving to server-held token auth.
- First meaningful render waits on the client auth round-trip (`auth-loader` awaited at boot) — accepted for an authenticated app behind login.

## Contracts Touched

- `project-summary.md` — ADR index row.
- `decisions/002_infra_sanctum-session-spa.md` — the auth half this record pairs with (why only; not restated here).
- `features/001_session-auth.md` — owns the resulting boot/auth behavior contract.

## Open Questions

## Verification

Docs-only. Verified against the repo on 2026-08-04: `nuxt.config.ts` sets `ssr: false`; the client-only boot flow (`auth-loader` plugin priming CSRF then fetching the user, fetcher `credentials: 'include'`) matches the SPA assumption. No token-mode server rendering exists (cross-checked in ADR 002).
