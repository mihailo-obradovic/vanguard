# Feature: Self-Service Profile

## Status

Active

Retro-documented at brownfield adoption (2026-08-02) from code, tests, and the original design spec (`docs/superpowers/specs/2026-07-29-self-service-profile-design.md`, implemented 2026-07-29 in `c7cf4d6` + `d7e1934`). The backend matches the spec verbatim; the frontend exceeds it.

## Task Weight

Medium

## Purpose

Let any authenticated user update their own name, email, and password without admin involvement — safely: email changes re-trigger verification, password changes require the current password, and the role can never be self-modified. Before this endpoint existed, the profile page saved through the admin-only `PUT /api/users/{id}` and non-admins got 403.

## Inputs

| Input | Type | Source | Constraints |
| --- | --- | --- | --- |
| `name` | string | `PUT /api/profile` body | `sometimes`, max 255 |
| `email` | string | body | `sometimes`, lowercase, valid email, max 255, unique ignoring self |
| `password` | string | body | `sometimes`, `confirmed`, Laravel `Password::defaults()` (min 8) |
| `current_password` | string | body | `required_with:password`, must match session user's password (web guard) |

All fields optional (`sometimes`) — partial updates are valid; `{}` is a 200 no-op. `role` is not accepted: absent from the rules and from `User`'s fillable set — sent values are silently ignored (tested).

## Outputs And Side Effects

| Output / Side Effect | Type | Description |
| --- | --- | --- |
| `200` + `{ data: UserResource }` | JSON | `id, name, email, role (string value), email_verified_at, created_at, updated_at` |
| Email verification reset | DB | changed email nulls `email_verified_at` (`User::changeEmail()`); same email = no-op returning `false` |
| Verification mail | queued notification | `VerifyEmailNotification` sent only when the email actually changed |

## Scope And Non-Goals

In scope: self-service update of name/email/password via `PUT /api/profile`; the shared `User::changeEmail()` semantics also used by the admin path.

Non-goals: admin user management (feature 002 — `PUT /api/users/{id}` keeps role assignment and skips `current_password`); account deletion; avatar/preferences; changing the admin routing or `admin` middleware.

## User / System Behavior

- When an authenticated user submits the profile form, the backend applies `changeEmail()` first, then fills only `name`/`password`, saves once, and re-sends verification only if the email changed.
- When the email is unchanged (strict compare; `lowercase` rule normalizes input first), verification status is untouched and nothing is sent.
- When a password change is requested without the correct `current_password`, the request 422s and no partial write occurs (tested).
- Frontend (`web/pages/profile.vue`): read view shows name, email, role badge, verification badge with a resend button when unverified; an edit modal submits via `useUpdateProfile`; on success the auth store is replaced wholesale (verification badge flips immediately), a success toast fires, and the modal resets. `?verified=1` on arrival refetches the user and toasts.
- Server 422s render inline per field (Regle external errors via `useValidationErrors` → `useExternalErrors`), with the validation toast suppressed; non-422 errors still toast centrally.

## Roles And Access

| Resource/action | Guest | User | Admin |
| --- | --- | --- | --- |
| `PUT /api/profile` (own record only — no route param exists) | 401 | ✔ | ✔ (acts on self) |

Every account type gets the same profile page; admins additionally manage others via feature 002.

## Examples

| Input | Expected Output | Notes |
| --- | --- | --- |
| `{ name: "New Name" }` | 200, name persisted | name-only save; empty `current_password` string is skipped (non-implicit rule) |
| `{ email: <changed> }` | 200, `email_verified_at` null, verification mail queued | tested |
| `{ password, password_confirmation, current_password: <wrong> }` | 422 on `current_password`, old password still valid | tested |
| `{ role: "admin" }` | 200, role unchanged | escalation blocked twice: rules + fillable |

## Business Rules

- Email uniqueness ignores the user's own row (`Rule::unique()->ignore($this->user()->id)`).
- `current_password` validates against the session (web) guard — correct for the stateful-Sanctum SPA.
- The controller acts only on `$request->user()`; editing another user via this endpoint is structurally impossible.

## Edge Cases

- Same-email resubmission short-circuits in `changeEmail()` — no verification reset, no mail (tested).
- The frontend always sends `current_password` (possibly `""`); Laravel skips non-implicit rules on empty strings, so name-only saves work.
- Client rules are stricter than the server: Regle marks `name`/`email` required, so the UI never issues a true partial update; the server contract still allows one.

## Invariants

- `role` can never change through this endpoint.
- A changed email always resets verification and re-sends exactly one (queued) verification link.
- Password changes always require the correct current password; failures leave the old password valid.
- Response envelope stays `{ data: UserResource }` — the SPA parses it with `UserEnvelopeSchema` (Zod) and rejects shape drift.

**Protected area (declared here, indexed in `project-summary.md`):** the `PUT /api/profile` contract — path, method, rules, and response envelope above.

## Error Handling

- Guest → 401 JSON (no redirect — `bootstrap/app.php` renders JSON for `api/*` and `redirectGuestsTo(null)`).
- Validation → 422 `{ errors: { field: [messages] } }`, rendered inline in the form; submit stays disabled until the offending field is edited.
- `403` cannot occur (`authorize()` is just "user exists" behind `auth:sanctum`).

## Entry Points

- `routes/api.php:13` — `PUT /api/profile` (no name, no throttle, PUT only).
- `app/Http/Controllers/ProfileController.php` / `app/Http/Requests/ProfileUpdateRequest.php` — the contract's server half.
- `app/Models/User.php` — `changeEmail()` + overridden `sendEmailVerificationNotification()` (queued).
- `web/pages/profile.vue` + `web/services/queries/useAuthQueries.ts` (`useUpdateProfile`) + `web/services/auth.api.ts` (`updateProfile`) — the SPA half.

## Dependencies

- Session auth (feature 001): `auth:sanctum` guards the route; 401 handling and the auth store live there.
- User management (feature 002): shares `User::changeEmail()` semantics on the admin path; `UserResource` shape is common.
- Queued notifications: `VerifyEmailNotification` requires a running queue worker to actually deliver.

## Open Questions

## Tests

- `tests/Feature/ProfileTest.php` — 10 tests, 1:1 with the design spec: name update, password change happy/wrong/missing current password, email change resets + resends, same-email no-op, role-escalation blocked, guest 401, plus the two admin-path email tests.
- Known gaps (recorded, not smoothed over): no tests for email uniqueness collision / `lowercase` / format 422s, password min-length or `confirmed`-mismatch 422s, empty-body no-op, or full response-body shape; `changeEmail()` has no unit test (accepted in the spec); the frontend half (profile.vue, `useUpdateProfile`, Regle schema, store update) has zero tests.

## Verification

Backend suite green at adoption: `php artisan test` → 36 passed (98 assertions), including all 10 profile tests, on sqlite `:memory:`. Spec-vs-reality audit (2026-08-02) found every backend design point implemented verbatim; deviations are frontend-only (stricter client rules; always-sent `current_password`) and are documented above.

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
