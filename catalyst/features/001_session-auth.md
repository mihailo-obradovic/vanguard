# Feature: Session Auth Flow

## Status

Active

Retro-documented at brownfield adoption (2026-08-02). Implemented 2026-07-28 (`b857a34` and neighbors); frontend flow refined through July 2026.

## Task Weight

Hard

## Purpose

Authenticate the Nuxt SPA against the Laravel API with Sanctum's stateful cookie mode: session cookies instead of stored tokens, CSRF-protected, JSON-only. Covers registration, login/logout, email verification, and password reset — everything in front of the session.

## Inputs

| Input                                          | Type       | Source                          | Constraints                                                             |
| ---------------------------------------------- | ---------- | ------------------------------- | ----------------------------------------------------------------------- |
| `name`, `email`, `password`(+`_confirmation`)  | strings    | `POST /register`                | name max 255; email lowercase/unique/max 255; password confirmed, 8–255 |
| `email`, `password`                            | strings    | `POST /login`                   | required; 5 attempts per email+IP, then throttled                       |
| `email`                                        | string     | `POST /forgot-password`         | required, valid email                                                   |
| `token`, `email`, `password`(+`_confirmation`) | strings    | `POST /reset-password`          | token required; password confirmed, 8–255                               |
| `id`, `hash` + signature                       | URL params | `GET /verify-email/{id}/{hash}` | signed URL (60 min), `throttle:6,1`, hash = sha1 of user email          |

## Outputs And Side Effects

| Output / Side Effect             | Type         | Description                                                                                                                                                      |
| -------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `204 No Content`                 | HTTP         | register, login, logout — no body; session rotation per Invariants                                                                                               |
| `200 {"status": ...}`            | JSON         | forgot/reset password, resend verification (`verification-link-sent` / `already-verified`)                                                                       |
| `GET /api/user` → `UserResource` | JSON         | `{ "data": ... }` envelope — `id, name, email, role, email_verified_at, created_at, updated_at` (password/remember_token hidden)                                 |
| Verify redirect                  | 302          | signed mail link hits the API, then bounces to `FRONTEND_URL/profile?verified=1`                                                                                 |
| Queued mail                      | notification | `VerifyEmailNotification` (register + resend); `ResetPasswordNotification` — link points directly at the SPA (`FRONTEND_URL/password-reset?token=...&email=...`) |

## Scope And Non-Goals

In scope: the endpoints above (all in `routes/web.php` except `GET /api/user`), Sanctum stateful mechanics, CSRF flow, the SPA's auth store/middleware/fetcher, verification and reset round-trips.

Non-goals: role gating (feature 002 owns the only `admin` gate); profile editing (feature 003); token-mode auth (dormant — see ADR 002); "remember me" (accepted by `LoginRequest` but never sent by the SPA).

## User / System Behavior

- Registration creates the user, fires `Registered` (→ queued verification mail), and logs the user in.
- Login validates via the web guard; the SPA follows success with `GET /api/user` into the store (two-request flow). Failure is a 422 on `email`; the 6th failure in the window 422s with the throttle message. On logout the SPA resets the store.
- SPA boot (`auth-loader` plugin, awaited): `GET /sanctum/csrf-cookie` first, then `GET /api/user` into the store (failure → guest). Route middleware runs only after this settles.
- Route decisions (`authRedirectLogic`, default-deny): `/` → `/home` always; guests on any page not in the guest-only/shared lists → `/home`, where the layout offers the login dialog; logged-in users on the one guest-only page (`/password-reset`) → `/home`. No return-URL preservation. This branch has no auth pages to redirect to — login, registration, and forgot-password are dialogs.
- Fetcher: every request `credentials: 'include'` + JSON Accept; `X-XSRF-TOKEN` on state-changing methods; on 419 it re-primes the CSRF cookie and retries exactly once (central error handling below).
- Email verification: signed mail link hits the API, marks verified, bounces to `/profile?verified=1`; the profile page refetches and toasts. Password reset: SPA seeds token and email from the query, posts token+password, `/` (→ `/home`) on success; a bad token 422s on `email`.

## Roles And Access

Not role-specific — no auth endpoint is role-gated; registration cannot set a role (DB default `user`). The `role` cast, `isAdmin()`, and the SPA's `isAdmin` getter are consumed by feature 002.

## Examples

| Input                                               | Expected Output                      | Notes                                                       |
| --------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------- |
| `POST /login` valid creds                           | 204, session regenerated             | tested; SPA follows with `GET /api/user`                    |
| `POST /login` wrong password ×6                     | 422 ×5 on `email`, then throttle 422 | tested                                                      |
| `GET /api/user` as guest (even without JSON Accept) | 401 JSON, never a redirect           | tested — `redirectGuestsTo(null)` + forced JSON for `api/*` |
| `POST /login` while already authenticated           | 403 JSON, never a redirect           | tested — `redirectUsersTo(abort(403))`                      |
| `GET /verify-email/{id}/{bad-hash}`                 | 403, still unverified                | tested                                                      |
| `POST /forgot-password` unknown email               | 422 on `email`                       | **leaks account existence** — recorded, not smoothed over   |

## Business Rules

- **The password policy is stated once**, as `Password::defaults()` in `AppServiceProvider::boot()`; every rule set in features 001–003 and the GraphQL validator defers to it. Length 8–255 — the ceiling is bcrypt's 72-byte truncation made explicit — no composition rules (NIST 800-63B), plus `uncompromised()` **in production only**, so nothing else depends on Have I Been Pwned.
- Stateful domains: `SANCTUM_STATEFUL_DOMAINS=localhost:3000,localhost:3001`; Sanctum guard `web`; sessions in the database (`SESSION_DRIVER=database`, lifetime 120 min, `SameSite=lax`, `SESSION_DOMAIN=localhost`).
- CORS (`config/cors.php`): credentialed, origins = `FRONTEND_URL` (+ `localhost:3001` in local/testing), fails closed when `FRONTEND_URL` unset; `verify-email/*` deliberately absent (browser navigation, not XHR).
- Same-site-lax works only because both origins share `localhost`; a cross-domain production split would need `SameSite=None; Secure`.

## Edge Cases

- An authenticated request to any `guest` route (e.g. `POST /login`) gets 403 JSON via `redirectUsersTo(abort(403))` — never `RedirectIfAuthenticated`'s default 302 to `/`. Tested.
- Resend-verification toast in the SPA is unconditional — an already-verified user is still told "Verification email sent" (server said `already-verified`; the status is discarded client-side).
- The `auth-loader` plugin catches only the user-fetch failure; an unreachable API at boot rejects the CSRF call uncaught. Tested.

## Invariants

- Auth state lives in the session cookie; the SPA store is memory-only and rehydrated from `GET /api/user` on every boot.
- Register/login/logout return `204 No Content` — no body for the SPA to parse.
- Every user-returning endpoint, `GET /api/user` included, wraps in `UserResource` — one `{ data: ... }` envelope for the whole API; the SPA parses user payloads with `UserEnvelopeSchema`.
- Unauthenticated API requests always get 401 JSON, never a login redirect; authenticated requests to guest routes always get 403 JSON, never a home redirect.
- Session ID rotates on login/register; session invalidates on logout.

**Protected area (declared here, indexed in `project-summary.md`):** the endpoint set and response contracts above (`routes/web.php` auth routes + `GET /api/user`), and the session/auth mechanics (cookie + CSRF flow, stateful domains, database sessions, JSON-only/no-redirect posture in `bootstrap/app.php`). The SPA's fetcher, store, and middleware all assume them.

## Error Handling

- 401 → JSON `{"message":"Unauthenticated."}`; SPA resets the store and the `isLoggedIn` watcher in `app.vue` re-runs the redirect logic, landing a guest on `/home`. 403 → SPA navigates `/home`. 419 → fetcher retries once after re-priming CSRF. 422 → inline in opted-in forms, toast otherwise.
- Login throttle: 422 with `auth.throttle` message; limiter clears on success.

## Entry Points

- Backend: `routes/web.php` (guest + auth groups), `routes/api.php` (`GET /api/user` via `AuthenticatedUserController`), `app/Http/Controllers/Auth/*`, `app/Http/Requests/Auth/LoginRequest.php` (rate limiting), `bootstrap/app.php` (statefulApi, no guest redirects, JSON rendering), `config/{sanctum,session,cors}.php`, `app/Notifications/*` (queued), `app/Providers/AppServiceProvider.php` (SPA reset-URL builder).
- SPA: `web/plugins/auth-loader.ts`, `web/middleware/auth.global.ts` + `web/utils/authRedirectLogic.ts`, `web/utils/{fetcher,handleApiError}.ts`, `web/stores/useAuthStore.ts`, `web/services/auth.api.ts` + `web/services/queries/useAuthQueries.ts`, the `password-reset` page, and the `LoginDialog` / `RegisterDialog` / `ForgotPasswordDialog` components mounted from `layouts/Default.vue`.

## Dependencies

- Notifications implement `ShouldQueue`; `sync` (local default) sends inline, the `database` driver needs a running worker (`operations.md`).
- `FRONTEND_URL` drives CORS origins, the reset-link URL, and the verify bounce.
- Features 002/003 sit behind `auth:sanctum` and the store/fetcher established here.

## Open Questions

## Tests

- Backend: `tests/Feature/Auth/` — 44 tests (authentication 17, registration 10, password reset 12, email verification 5). The ones pinning a decision rather than a happy path: the throttle firing at exactly five attempts, its message reporting the seconds left, its counter clearing on success, its scope covering email _and_ client address; logout flushing the session and reissuing the CSRF token; a guest-route request while authenticated returning 403, not a redirect; mixed-case sign-in accepted (no `lowercase` on the read path); the password-length bounds at 7/8 and 256/255; the reset link resolving to the front-end page (also exercising the `AppServiceProvider` URL closure).
- Frontend: `authRedirectLogic.spec.ts` (7 cases, one per arm of the redirect table above — the spec is the readable enumeration); `auth.api.spec.ts` (every session endpoint, web-route paths included, since the stateful posture depends on them); `useAuthQueries.spec.ts` (store side effects of login, register, refresh, logout); `useAuthStore.spec.ts`; `fetcher.spec.ts` (the client half of the 419 recovery); `auth-loader.spec.ts` (5 cases: boot ordering, and each way priming leaves nobody signed in); the auth dialogs' specs.
- Known gaps (recorded): untested — the server-side CSRF/419 path (Laravel skips CSRF in tests), verification-resend throttle, `remember` flag; **the production-only `uncompromised()` arm** (testing it means calling Have I Been Pwned from the suite); **session-id rotation itself is untestable here** — a test request carries no session cookie, so the id differs before and after any request and the comparison passes whatever the controller does (two such tests were removed in the mutation audit; login's rotation is `SessionGuard::updateSession()`'s, not the controller's); hardcoded dev credentials in `LoginDialog.vue` (intentional, kept for local development). Note: the unknown-email 422 asserts the current enumeration-friendly behavior — hardening it is a product decision, not a test gap.

## Verification

Backend suite green at adoption: 36 passed including all 16 auth tests; frontend 14 passed including the 5 redirect cases. Endpoint table, config values, and redirect rules verified line-by-line against the source (2026-08-02).

B3 (2026-08-02): `GET /api/user` moved to the `UserResource` envelope (backend + SPA parser + test in one change); stock example tests removed with the welcome route — 34 tests green on MySQL, `route:cache` succeeds.

2026-08-12: authenticated requests to guest routes now return 403 JSON (`redirectUsersTo(abort(403))` in `bootstrap/app.php`), closing the recorded 302-to-`/` edge case — 38 tests green.

2026-08-15, the auth dialogs' own specs: 25 sabotage-proven cases. Writing them exposed a hardcoded English hint in `ForgotPasswordDialog` (`auth.forgotPassword.hint` was in every catalog, never wired), so a Serbian visitor read it in English. Walked live: signed out, opened login → forgot-password, hint rendered in Cyrillic. Detail in `operations.md`.

2026-08-15, merged from master: the password policy now lives in `Password::defaults()`, and login/forgot/reset gained `max:255` on email — 122 backend tests green. The client-side mirrors still need porting to this branch's dialogs.

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
