# Feature: Email Verification & Password Reset

## Status

Active

## Task Weight

Medium

## Purpose

Close the two mail-driven account-lifecycle loops that sit around the session rather than inside it: proving the user owns the address on their account, and recovering an account whose password is lost.

## Inputs

| Input                                          | Type       | Source                                  | Constraints                                                                   |
| ---------------------------------------------- | ---------- | --------------------------------------- | ----------------------------------------------------------------------------- |
| `email`                                        | string     | `POST /forgot-password`                 | required, valid email, max 255; `guest` group                                 |
| `token`, `email`, `password`(+`_confirmation`) | strings    | `POST /reset-password`                  | token required; email as above; password `confirmed`, `Password::defaults()`  |
| `id`, `hash` + signature                       | URL params | `GET /verify-email/{id}/{hash}`         | signed URL (60 min), `auth` + `throttle:6,1`; hash = sha1 of the user's email |
| —                                              | —          | `POST /email/verification-notification` | no body; `auth` + `throttle:6,1`; acts on the session user                    |

## Outputs And Side Effects

| Output / Side Effect  | Type         | Description                                                                                                              |
| --------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `200 {"status": ...}` | JSON         | forgot/reset return the translated password-broker status; resend returns `verification-link-sent` or `already-verified` |
| Verify redirect       | 302          | the signed link bounces to `FRONTEND_URL/profile?verified=1` — the one auth route that answers with a redirect           |
| `email_verified_at`   | DB           | set on the first successful verify only, firing `Verified`                                                               |
| Password rewritten    | DB           | `Password::reset()` re-hashes the password and rotates `remember_token`, firing `PasswordReset`                          |
| Queued mail           | notification | `VerifyEmailNotification` (registration + resend); `ResetPasswordNotification`, whose link points at the SPA reset page  |

## Scope And Non-Goals

In scope: the four endpoints above, the SPA's forgot-password dialog and `password-reset` page, and the resend button and `?verified=1` landing on the profile page.

Non-goals: registration, login, logout, and session/CSRF mechanics (feature 001); stating the password policy (001 owns it — this flow defers); the profile email change that nulls verification (feature 003); any admin-side verification or reset affordance (none exists).

## User / System Behavior

- The forgot-password dialog posts the address; when the broker accepts it, a queued `ResetPasswordNotification` goes out and the SPA toasts the returned status and closes the dialog. The mailed link targets the SPA directly (`FRONTEND_URL/password-reset?token=...&email=...`), built by `ResetPassword::createUrlUsing()` — never a backend page.
- The reset page seeds both `token` and `email` from the query string and posts them with the new password; on success it toasts the status and navigates to `/` (→ `/home`). Cancelling goes to `/` too.
- Registration (feature 001) fires `Registered`, which queues the first verification mail. Opening the signed link hits the API under `auth`, marks the address verified on the first hit, and bounces to `/profile?verified=1`; the profile page refetches the user and toasts.
- The resend button on the profile card posts to `/email/verification-notification`; the server sends a fresh link, or answers `already-verified` when there is nothing to send.
- Broker and token failures come back as a 422 on `email` and render inline under the email input, with the validation toast suppressed.

## Roles And Access

Not role-specific — no endpoint here is role-gated. Forgot/reset sit in the `guest` group (an authenticated caller gets 403 JSON); verify and resend sit behind `auth` (a guest gets 401 JSON).

## Examples

| Input                                                 | Expected Output                                          | Notes                                                     |
| ----------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------- |
| `POST /forgot-password` known email                   | 200 `{status}`, reset mail queued                        | link resolves to the SPA reset page                       |
| `POST /forgot-password` unknown email                 | 422 on `email`                                           | **leaks account existence** — recorded, not smoothed over |
| `POST /forgot-password` twice in a row                | 422 on `email` (broker throttle)                         | the broker, not a route rate limiter                      |
| `POST /reset-password` valid token                    | 200 `{status}`, password rewritten, SPA → `/home`        | `remember_token` rotated                                  |
| `POST /reset-password` invalid or expired token       | 422 on `email`                                           | surfaces under the email input                            |
| `GET /verify-email/{id}/{bad-hash}`                   | 403, still unverified                                    | signature/hash mismatch                                   |
| `GET /verify-email/{id}/{hash}` when already verified | 302 to `/profile?verified=1`, no second `Verified` event | idempotent                                                |
| `POST /email/verification-notification` when verified | 200 `{"status":"already-verified"}`, no mail             |                                                           |

## Business Rules

- The verification link is a Laravel signed URL valid 60 minutes; verify and resend are rate-limited at `throttle:6,1`, while repeat reset-link requests are limited by the password broker itself, not by a route limiter.
- Reset password rules defer to `Password::defaults()` (feature 001); `email` is bounded at `max:255` on both mail endpoints.
- `verify-email/*` is deliberately absent from the CORS allow-list — it is a browser navigation, not an XHR.

## Edge Cases

- The SPA's resend toast is unconditional: an already-verified user is still told the mail was sent, because the `already-verified` status is discarded client-side.
- Verification is idempotent — a second hit on a valid link skips `markEmailAsVerified()` and the `Verified` event and still bounces to the SPA.
- Because verify and resend live behind `auth`, a verification link opened without the session cookie 401s instead of verifying.

## Invariants

- A successful reset always rewrites the password hash and rotates `remember_token`.
- Verification state is set only here; feature 003's email change is the only thing that clears it.
- Both mail-driven flows answer `{"status": ...}` on success and 422 on `email` on failure — the verify endpoint's 302 to the SPA is the single deliberate redirect in the auth surface.

**Protected area (declared here, indexed in `project-summary.md`):** the endpoint set and response contracts above — `POST /forgot-password`, `POST /reset-password`, `GET /verify-email/{id}/{hash}`, and `POST /email/verification-notification`, including the SPA-targeted reset link and the verify bounce.

## Error Handling

- Broker failures — unknown email, invalid or expired token, throttled repeat — become a 422 on `email` carrying the translated status message.
- Signature or hash mismatch on the verify link → 403; exceeding `throttle:6,1` → 429; wrong-group access → 401 or 403 JSON per Roles And Access.

## Entry Points

- Backend: `routes/web.php` (forgot/reset in the `guest` group, verify/resend in the `auth` group), `app/Http/Controllers/Auth/{PasswordResetLinkController,NewPasswordController,VerifyEmailController,EmailVerificationNotificationController}.php`, `app/Notifications/{ResetPasswordNotification,VerifyEmailNotification}.php`, `app/Providers/AppServiceProvider.php` (the SPA reset-URL closure), `app/Models/User.php` (queued notification overrides).
- SPA: `web/components/users/ForgotPasswordDialog.vue` (mounted from `layouts/Default.vue`), `web/pages/password-reset.vue` (the one guest-only route, `empty` layout), the resend button in `web/components/users/UserCard.vue` and the `?verified=1` handling in `web/pages/profile.vue`, `web/services/auth.api.ts` + `web/services/queries/useAuthQueries.ts`.

## Dependencies

- Feature 001 (session auth): the `guest`/`auth` groups and their 401/403 JSON posture, the fetcher and central error routing, and the password policy this flow's reset rules defer to. Registration there queues the first verification mail; the round-trip is owned here.
- Feature 003 (self-service profile): an email change nulls `email_verified_at` and re-sends this feature's verification mail; the profile card hosts the resend button, and the profile page the `?verified=1` landing.
- `FRONTEND_URL` drives both the reset link and the verify bounce.
- Both notifications implement `ShouldQueue`: `sync` sends inline locally, the `database` driver needs a running worker (`operations.md`).

## Open Questions

## Tests

- `tests/Feature/Auth/PasswordResetTest.php` — 12 tests: link requested and mail queued, required-field and overlong-email 422s on both endpoints, the unknown-email 422, the immediate-second-request throttle, the link resolving to the front-end page (which also exercises the `AppServiceProvider` closure), the reset round-trip, invalid token, below-minimum password, and confirmation mismatch. The length bounds are pinned at 7/8 and 256/255.
- `tests/Feature/Auth/EmailVerificationTest.php` — 5 tests: registration queues the notification, the signed URL verifies and redirects to the front end, an invalid hash does not verify, a link can be resent, and resending for a verified user reports `already-verified`.
- `auth.api.spec.ts` and `useAuthQueries.spec.ts` cover the forgot/reset/resend service and query layers; `ForgotPasswordDialog` has its own spec, and `UserCard.spec.ts` covers the verification chip and the resend it sends.
- Known gaps: the verification-resend throttle is untested; `password-reset.vue` has no component test and stays on the live browser walk. The unknown-email 422 test asserts the current enumeration-friendly behavior — hardening it is a product decision, not a test gap.

## Verification

`php artisan test` is green against the MySQL `vanguard_testing` database (`operations.md`), the 12 password-reset and 5 email-verification tests included. Endpoints, middleware groups, throttles, broker statuses and the reset-URL closure are traced line-by-line to source.

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
