# Feature: Session Auth Flow

## Status

Active

## Task Weight

Hard

## Purpose

Authenticate the Nuxt SPA against the Laravel API with Sanctum's stateful cookie mode: session cookies instead of stored tokens, CSRF-protected, JSON-only. Covers registration, login/logout, and the whole SPA-side session plumbing — everything in front of the session itself.

## Inputs

| Input                                         | Type    | Source           | Constraints                                                             |
| --------------------------------------------- | ------- | ---------------- | ----------------------------------------------------------------------- |
| `name`, `email`, `password`(+`_confirmation`) | strings | `POST /register` | name max 255; email lowercase/unique/max 255; password confirmed, 8–255 |
| `email`, `password`                           | strings | `POST /login`    | required; 5 attempts per email+IP, then throttled                       |

## Outputs And Side Effects

| Output / Side Effect             | Type         | Description                                                                                                                      |
| -------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `204 No Content`                 | HTTP         | register, login, logout — no body; session rotation per Invariants                                                               |
| `GET /api/user` → `UserResource` | JSON         | `{ "data": ... }` envelope — `id, name, email, role, email_verified_at, created_at, updated_at` (password/remember_token hidden) |
| Queued mail                      | notification | registration fires `Registered` → queued `VerifyEmailNotification`; the round-trip belongs to feature 009                        |

## Scope And Non-Goals

In scope: `POST /register`, `POST /login`, `POST /logout` (`routes/web.php`) and `GET /api/user`, Sanctum stateful mechanics, the CSRF flow, and the SPA's auth store, boot plugin, route middleware and fetcher.

Non-goals: email verification and password reset (feature 009); role gating (feature 002 owns the only `admin` gate); profile editing (feature 003); token-mode auth (dormant — see ADR 002); "remember me" (accepted by `LoginRequest` but never sent by the SPA).

## User / System Behavior

- Registration creates the user, fires `Registered` (→ queued verification mail, feature 009), and logs the user in.
- Login validates via the web guard; the SPA follows success with `GET /api/user` into the store (two-request flow). Failure is a 422 on `email`; the 6th failure in the window 422s with the throttle message. On logout the SPA resets the store.
- SPA boot (`auth-loader` plugin, awaited): `GET /sanctum/csrf-cookie` first, then `GET /api/user` into the store (failure → guest). Route middleware runs only after this settles.
- Route decisions (`authRedirectLogic`, default-deny): `/` → `/home` always; guests on any page not in the guest-only/shared lists → `/home`, where the layout offers the login dialog; logged-in users on the one guest-only page (`/password-reset`) → `/home`. No return-URL preservation. This branch has no auth pages to redirect to — login, registration, and forgot-password are dialogs.
- Fetcher: every request `credentials: 'include'` + JSON Accept; `X-XSRF-TOKEN` on state-changing methods; on 419 it re-primes the CSRF cookie and retries exactly once (central error handling below).

## Roles And Access

Not role-specific — no auth endpoint is role-gated; registration cannot set a role (DB default `user`). The `role` cast, `isAdmin()`, and the SPA's `isAdmin` getter are consumed by feature 002.

## Examples

| Input                                               | Expected Output                      | Notes                                              |
| --------------------------------------------------- | ------------------------------------ | -------------------------------------------------- |
| `POST /login` valid creds                           | 204, session regenerated             | SPA follows with `GET /api/user`                   |
| `POST /login` wrong password ×6                     | 422 ×5 on `email`, then throttle 422 | limiter clears on success                          |
| `GET /api/user` as guest (even without JSON Accept) | 401 JSON, never a redirect           | `redirectGuestsTo(null)` + forced JSON for `api/*` |
| `POST /login` while already authenticated           | 403 JSON, never a redirect           | `redirectUsersTo(abort(403))`                      |

## Business Rules

- The password policy is stated once, as `Password::defaults()` in `AppServiceProvider::boot()`; every rule set in features 001–003, 009 and the GraphQL validator defers to it. Length 8–255 — the ceiling is bcrypt's 72-byte truncation made explicit — no composition rules (NIST 800-63B), plus `uncompromised()` in production only, so nothing else depends on Have I Been Pwned.
- Stateful domains: `SANCTUM_STATEFUL_DOMAINS=localhost:3000,localhost:3001`; Sanctum guard `web`; sessions in the database (`SESSION_DRIVER=database`, lifetime 120 min, `SameSite=lax`, `SESSION_DOMAIN=localhost`).
- CORS (`config/cors.php`): credentialed, origins = `FRONTEND_URL` (+ `localhost:3001` in local/testing), fails closed when `FRONTEND_URL` unset.
- Same-site-lax works only because both origins share `localhost`; a cross-domain production split would need `SameSite=None; Secure`.

## Edge Cases

- An authenticated request to any `guest` route (e.g. `POST /login`) gets 403 JSON via `redirectUsersTo(abort(403))` — never `RedirectIfAuthenticated`'s default 302 to `/`.
- The `auth-loader` plugin catches only the user-fetch failure; an unreachable API at boot rejects the CSRF call uncaught.

## Invariants

- Auth state lives in the session cookie; the SPA store is memory-only and rehydrated from `GET /api/user` on every boot.
- Register/login/logout return `204 No Content` — no body for the SPA to parse.
- Every user-returning endpoint, `GET /api/user` included, wraps in `UserResource` — one `{ data: ... }` envelope for the whole API; the SPA parses user payloads with `UserEnvelopeSchema`.
- Unauthenticated API requests always get 401 JSON, never a login redirect; authenticated requests to guest routes always get 403 JSON, never a home redirect.
- Session ID rotates on login/register; session invalidates on logout.

**Protected area (declared here, indexed in `project-summary.md`):** the register/login/logout and `GET /api/user` contracts above, and the session/auth mechanics — cookie + CSRF flow, stateful domains, database sessions, and the JSON-only/no-redirect posture in `bootstrap/app.php`. The SPA's fetcher, store, and middleware all assume them. Feature 009's endpoints are protected in its own document.

## Error Handling

- 401 → JSON `{"message":"Unauthenticated."}`; SPA resets the store and the `isLoggedIn` watcher in `app.vue` re-runs the redirect logic, landing a guest on `/home`. 403 → SPA navigates `/home`. 419 → fetcher retries once after re-priming CSRF. 422 → inline in opted-in forms, toast otherwise.
- Login throttle: 422 with `auth.throttle` message; limiter clears on success.

## Entry Points

- Backend: `routes/web.php` (the `guest` and `auth` groups), `routes/api.php` (`GET /api/user` via `AuthenticatedUserController`), `app/Http/Controllers/Auth/{RegisteredUserController,AuthenticatedSessionController}.php`, `app/Http/Requests/Auth/LoginRequest.php` (rate limiting), `bootstrap/app.php` (statefulApi, no guest redirects, JSON rendering), `config/{sanctum,session,cors}.php`, `app/Providers/AppServiceProvider.php` (`Password::defaults()`).
- SPA: `web/plugins/auth-loader.ts`, `web/middleware/auth.global.ts` + `web/utils/authRedirectLogic.ts`, `web/utils/{fetcher,handleApiError}.ts`, `web/stores/useAuthStore.ts`, `web/services/auth.api.ts` + `web/services/queries/useAuthQueries.ts`, and the `LoginDialog` / `RegisterDialog` components mounted from `layouts/Default.vue`.

## Dependencies

- Feature 009 (email verification & password reset): owns the mail-driven round-trips this feature's registration starts, and defers to the password policy stated here.
- `FRONTEND_URL` drives the CORS origins.
- Features 002/003 sit behind `auth:sanctum` and the store/fetcher established here.

## Open Questions

## Tests

- Backend: `tests/Feature/Auth/AuthenticationTest.php` (16) and `RegistrationTest.php` (10). The cases worth naming, because they pin a decision rather than a happy path: the throttle fires at exactly five attempts, its lockout message reports the seconds remaining, its counter clears on success, and it is scoped to the email _and_ the client address; logout flushes the session and reissues the CSRF token; an authenticated request to a guest route is 403, not a redirect; mixed-case sign-in is accepted (no `lowercase` on the read path); the password-length bounds are pinned on both sides at 7/8 and 256/255.
- Frontend: `authRedirectLogic.spec.ts` (7 cases, one per arm of the redirect table above — the spec is the readable enumeration); `auth.api.spec.ts` (every session endpoint, web-route paths included, since the stateful posture depends on them); `useAuthQueries.spec.ts` (store side effects of login, register, refresh, logout); `useAuthStore.spec.ts`; `fetcher.spec.ts` (the client half of the 419 recovery); `auth-loader.spec.ts` (the CSRF cookie awaited before the session read, the user restored from the cookie, an expired session and a schema-violating user each leaving nobody signed in, and an unprimeable CSRF cookie failing the boot); the `LoginDialog` and `RegisterDialog` specs.
- Known gaps: untested — the server-side CSRF/419 path (Laravel skips CSRF in tests) and the `remember` flag; the production-only `uncompromised()` arm (asserting it means either calling Have I Been Pwned from the suite or reading the rule's private state; the length bounds are pinned on both sides instead); session-id rotation itself is untestable here — a test request carries no session cookie, so the id differs before and after any request and an id comparison passes no matter what the controller does (login's rotation is `SessionGuard::updateSession()`'s doing, not the controller's); hardcoded dev credentials in `LoginDialog.vue` (intentional, kept for local development).

## Verification

`php artisan test` is green against the MySQL `vanguard_testing` database (`operations.md`) and `route:cache` succeeds; the frontend suite covers the redirect, store, fetcher and boot-plugin cases above, plus 25 sabotage-proven cases across the auth dialogs. The endpoint table, config values and redirect rules are traced line-by-line to source, and a live signed-out walk through the login and forgot-password dialogs renders their copy in the active locale. The shared client-side rule factories now drive these dialogs too (`features/006`): login and forgot-password take `credentialEmailRules()`, register takes `accountEmailRules()`. Both were walked live on 2026-08-16 (`features/006` carries the detail): the register dialog's field-named errors render correctly and its debounce measured 843ms end to end, and login still accepts a mixed-case address, which is the read path's own rule set showing through.

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
