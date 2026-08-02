# Feature: Session Auth Flow

## Status

Active

Retro-documented at brownfield adoption (2026-08-02) from code, tests, and config. Implemented 2026-07-28 (`b857a34` and neighbors); frontend flow refined through July 2026.

## Task Weight

Hard

## Purpose

Authenticate the Nuxt SPA against the Laravel API with Sanctum's stateful cookie mode: session cookies instead of stored tokens, CSRF-protected, JSON-only. Covers registration, login/logout, email verification, and password reset — everything in front of the session.

## Inputs

| Input | Type | Source | Constraints |
| --- | --- | --- | --- |
| `name`, `email`, `password`(+`_confirmation`) | strings | `POST /register` | name max 255; email lowercase/unique/max 255; password confirmed, min 8 |
| `email`, `password` | strings | `POST /login` | required; 5 attempts per email+IP, then throttled |
| `email` | string | `POST /forgot-password` | required, valid email |
| `token`, `email`, `password`(+`_confirmation`) | strings | `POST /reset-password` | token required; password confirmed, min 8 |
| `id`, `hash` + signature | URL params | `GET /verify-email/{id}/{hash}` | signed URL (60 min), `throttle:6,1`, hash = sha1 of user email |

## Outputs And Side Effects

| Output / Side Effect | Type | Description |
| --- | --- | --- |
| `204 No Content` | HTTP | register, login, logout — no body; session regenerated (login/register) or invalidated + token regenerated (logout) |
| `200 {"status": ...}` | JSON | forgot/reset password, resend verification (`verification-link-sent` / `already-verified`) |
| `GET /api/user` → raw `User` model | JSON | **no `data` envelope** — `id, name, email, role, email_verified_at, created_at, updated_at` (password/remember_token hidden) |
| Verify redirect | 302 | signed mail link hits the API, then bounces to `FRONTEND_URL/profile?verified=1` |
| Queued mail | notification | `VerifyEmailNotification` (register + resend); `ResetPasswordNotification` — link points directly at the SPA (`FRONTEND_URL/password-reset/{token}?email=...`) |

## Scope And Non-Goals

In scope: the endpoints above (all in `routes/web.php` under the `web` group except `GET /api/user`), Sanctum stateful mechanics, CSRF flow, the SPA's auth store/middleware/fetcher, verification and reset round-trips.

Non-goals: role gating (feature 002 owns the only `admin` gate); profile editing (feature 003); token-mode auth (`personal_access_tokens` table exists but nothing issues or accepts tokens — see ADR 002); "remember me" (accepted by `LoginRequest` but never sent by the SPA).

## User / System Behavior

- Registration creates the user (role from DB default `user`), fires `Registered` (→ queued verification mail), logs in, regenerates the session, returns 204.
- Login validates via the web guard; success regenerates the session, returns 204, and the SPA fetches `GET /api/user` into the store (two-request flow). Failure is a 422 on `email`; the 6th failure in the window 422s with the throttle message. Logout invalidates the session, regenerates the CSRF token, returns 204; the SPA resets the store.
- SPA boot (`auth-loader` plugin, awaited): `GET /sanctum/csrf-cookie` first, then `GET /api/user` into the store (failure → guest). Route middleware runs only after this settles.
- Route decisions (`authRedirectLogic`, default-deny): `/` → `/home` always; guests on any page not in the guest-only/shared lists → `/login`; logged-in users on guest-only pages (`/login`, `/register`, `/forgot-password`, `/password-reset/*`) → `/home`. No return-URL preservation.
- Fetcher: every request `credentials: 'include'` + JSON Accept; `X-XSRF-TOKEN` on state-changing methods; on 419 it re-primes the CSRF cookie and retries exactly once. Central handling: 401 resets the store → `/login`; 403 → `/home`; 422s inline where forms opt in, toast otherwise.
- Email verification: mail link hits the API host (signed), marks verified, bounces to `/profile?verified=1`; the profile page refetches and toasts. Password reset: SPA page seeds email from the query, posts token+password, `/login` on success; expired/invalid token surfaces as a 422 on `email`.

## Roles And Access

Not role-specific — no auth endpoint is role-gated. Registration cannot set a role (only name/email/password validated and filled; DB default `user`). The `role` cast, `isAdmin()`, and the SPA's `isAdmin` getter are consumed by feature 002.

## Examples

| Input | Expected Output | Notes |
| --- | --- | --- |
| `POST /login` valid creds | 204, session regenerated | tested; SPA follows with `GET /api/user` |
| `POST /login` wrong password ×6 | 422 ×5 on `email`, then throttle 422 | tested (5-attempt limit per email+IP) |
| `GET /api/user` as guest (even without JSON Accept) | 401 JSON, never a redirect | tested — `redirectGuestsTo(null)` + forced JSON for `api/*` |
| `GET /verify-email/{id}/{bad-hash}` | 403, still unverified | tested |
| `POST /forgot-password` unknown email | 422 on `email` | **leaks account existence** — recorded, not smoothed over |

## Business Rules

- Stateful domains: `SANCTUM_STATEFUL_DOMAINS=localhost:3000,localhost:3001`; Sanctum guard `web`; sessions in the database (`SESSION_DRIVER=database`, lifetime 120 min, `SameSite=lax`, `SESSION_DOMAIN=localhost`).
- CORS (`config/cors.php`): credentialed, origins = `FRONTEND_URL` (+ `localhost:3001` in local/testing), fails closed when `FRONTEND_URL` unset; `verify-email/*` deliberately absent (browser navigation, not XHR).
- Same-site-lax works only because both origins share `localhost`; a production split across apex domains would need `SameSite=None; Secure` — currently unset anywhere.

## Edge Cases

- An authenticated `POST /login` hits the `guest` middleware → 302 to `/` (no dashboard route exists). Untested.
- Resend-verification toast in the SPA is unconditional — an already-verified user is still told "Verification email sent" (server said `already-verified`; the status is discarded client-side).
- The `auth-loader` plugin catches only the user-fetch failure; an unreachable API at boot rejects the CSRF call uncaught.

## Invariants

- Auth state lives in the session cookie; the SPA store is memory-only and rehydrated from `GET /api/user` on every boot.
- Register/login/logout return `204 No Content` — no body for the SPA to parse.
- `GET /api/user` returns the **raw model without the `data` envelope**; every other user-returning endpoint wraps in `UserResource`. The SPA encodes both shapes (`UserSchema` vs `UserEnvelopeSchema`) — a known asymmetry, slated for reconciliation (Catalyst Laravel module departure #2), which is a contract change requiring user agreement.
- Unauthenticated API requests always get 401 JSON, never a login redirect.
- Session ID rotates on login/register; session invalidates on logout.

**Protected area (declared here, indexed in `project-summary.md`):** the endpoint set and response contracts above (`routes/web.php` auth routes + `GET /api/user`), and the session/auth mechanics (cookie + CSRF flow, stateful domains, database sessions, JSON-only/no-redirect posture in `bootstrap/app.php`). The SPA's fetcher, store, and middleware all assume them.

## Error Handling

- 401 → JSON `{"message":"Unauthenticated."}`; SPA resets store + `/login`. 403 → SPA navigates `/home`. 419 → fetcher retries once after re-priming CSRF. 422 → inline in opted-in forms, toast otherwise.
- Login throttle: 422 with `auth.throttle` message; limiter clears on success.

## Entry Points

- Backend: `routes/web.php` (guest + auth groups), `routes/api.php` (`GET /api/user` closure), `app/Http/Controllers/Auth/*`, `app/Http/Requests/Auth/LoginRequest.php` (rate limiting), `bootstrap/app.php` (statefulApi, no guest redirects, JSON rendering), `config/{sanctum,session,cors}.php`, `app/Notifications/*` (queued), `app/Providers/AppServiceProvider.php` (SPA reset-URL builder).
- SPA: `web/plugins/auth-loader.ts`, `web/middleware/auth.global.ts` + `web/utils/authRedirectLogic.ts`, `web/utils/{fetcher,handleApiError}.ts`, `web/stores/useAuthStore.ts`, `web/services/auth.api.ts` + `web/services/queries/useAuthQueries.ts`, pages `login`, `register`, `forgot-password`, `password-reset/[token]`.

## Dependencies

- Queued notifications need a running queue worker for mail to actually send.
- `FRONTEND_URL` drives CORS origins, the reset-link URL, and the verify bounce — three couplings on one env var.
- Features 002/003 sit behind `auth:sanctum` and the store/fetcher established here.

## Open Questions

## Tests

- Backend: `tests/Feature/Auth/` — 16 tests: authentication (7: login happy/invalid/throttle, current-user shape, guest 401 ×2, logout), registration (2, incl. default-role assertion), email verification (5: send, verify + redirect, bad hash 403, resend, already-verified), password reset (2 happy paths).
- Frontend: `web/utils/authRedirectLogic.spec.ts` (5 cases: guest on guest-only pages, reset-prefix match, authed on `/login`, default-deny `/users`, root alias).
- Known gaps (recorded): CSRF/419 path untested (Laravel skips CSRF in tests); `auth-loader` untested; session rotation asserted only via auth state; authed `POST /login` 302; throttle on verification endpoints; reset negative paths and forgot-password enumeration; `remember` flag; frontend store/fetcher/error-handling/query composables have no specs; hardcoded dev credentials in `login.vue` (cleanup candidate).

## Verification

Backend suite green at adoption: `php artisan test` → 36 passed (98 assertions) including all 16 auth tests; frontend `pnpm vitest run` → 14 passed including the 5 redirect cases. Endpoint table, config values, and redirect rules verified line-by-line against the source (2026-08-02).

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
