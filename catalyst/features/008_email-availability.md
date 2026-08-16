# Feature: Email Availability Check

## Status

Active

## Task Weight

Medium

## Purpose

Tell a user that an email address is already taken while they are still typing it. Without it, registration, admin user creation, and profile email changes only learn the address is taken from a 422 on submit — correct but late.

The endpoint exists only to answer that one question. The `unique` rules in features 001–003 remain the authority; this is a read-only hint that lets the client ask the question early.

## Inputs

| Input       | Type     | Source       | Constraints                                                                   |
| ----------- | -------- | ------------ | ----------------------------------------------------------------------------- |
| `email`     | `string` | query string | `required`, `string`, `email`, `max:255` — same shape the write endpoints use |
| `ignore_id` | `int`    | query string | `sometimes`, `integer` — the user being edited, excluded from the lookup      |

## Outputs And Side Effects

| Output / Side Effect    | Type | Description                                                           |
| ----------------------- | ---- | --------------------------------------------------------------------- |
| `{ "available": bool }` | JSON | `true` when no other user holds the address                           |
| Rate-limit headers      | HTTP | `throttle:30,1` per client — the endpoint is public and typed against |
| None                    | —    | Read-only: no writes, no session mutation, no mail                    |

## Scope And Non-Goals

In scope: one public `GET /api/email-availability` endpoint; the debounced async Regle rule that consumes it; wiring that rule into the register, users, and profile forms.

Non-goals: replacing the backend `unique` rules (they stay authoritative — a race between the check and the submit is resolved by the 422); checking any field other than email; adopting the Laravel Precognition protocol; rate-limit UX beyond letting the rule fail open.

## User / System Behavior

- While the user types an email, the client waits for a pause in typing (500 ms) and then asks the endpoint whether the address is free. The rule only fires once the field is otherwise valid — an incomplete address is never sent.
- If the address is taken, the field shows "This email address is already taken." alongside its other messages, and the form cannot submit.
- If the address is free, no message appears and the field validates as before.
- The rule fails open: a network error, a 429, or any non-200 leaves the field valid, and the server's `unique` rule still rejects the submit.
- Editing an existing user (admin) or one's own profile passes `ignore_id`, so keeping your own address is not reported as taken.
- The endpoint is public because the register form needs it before a session exists.

## Roles And Access

Not role-specific — the endpoint is public and unauthenticated; `ignore_id` is a lookup filter, not a permission. It reveals nothing an admin holds privately: the same yes/no is already obtainable by submitting the register form and reading the 422.

## Examples

| Input                                            | Expected Output                       | Notes                                       |
| ------------------------------------------------ | ------------------------------------- | ------------------------------------------- |
| `?email=free@example.com`                        | `{ "available": true }`               | no user holds it                            |
| `?email=taken@example.com`                       | `{ "available": false }`              | a user holds it                             |
| `?email=taken@example.com&ignore_id=<that user>` | `{ "available": true }`               | editing yourself keeps your own address     |
| `?email=not-an-email`                            | `422`                                 | same email rule as the write endpoints      |
| `?email=` (missing)                              | `422`                                 | `required`                                  |
| 31st request within a minute                     | `429`                                 | `throttle:30,1`; the client rule fails open |
| Endpoint unreachable, address actually taken     | field stays valid; submit returns 422 | fail-open, server authoritative             |

## Business Rules

- The check is a hint, never a gate: the client rule fails open and the backend `unique` rule decides.
- Availability is asked only for a syntactically valid, non-empty address — no request per keystroke.
- The endpoint is read-only and public, and is rate-limited because of it.

## Edge Cases

- **Race**: an address free at check time and taken at submit time yields a 422, rendered inline by feature 006's bridge. Expected, not a defect.
- **Own address on edit**: `ignore_id` covers it; without the parameter a user editing their profile would be told their own address is taken.
- **Case**: the lookup matches the way the database matches (`ci` collation), so `Taken@example.com` reports the same as `taken@example.com`. The write endpoints additionally enforce `lowercase`, mirrored client-side (feature 006), so a mixed-case address is flagged by that rule first.
- **An unknown `ignore_id`** filters nothing out; it is not validated for existence, because it only ever narrows a public read.

## Invariants

- The endpoint never writes, never mutates the session, and never returns user data — only a boolean.
- The client rule never blocks a submit on its own failure to reach the server.
- Backend `unique` rules stay in place and stay authoritative.

No protected area of its own.

## Error Handling

- Invalid or missing `email` → 422 (standard Laravel shape).
- Over the rate limit → 429; the client rule treats it as "no opinion" and passes.
- Any client-side transport failure → rule resolves valid, no toast (this is a background hint, not a user action).

## Entry Points

- `routes/api.php`: the public `GET /email-availability` route with its throttle.
- `app/Http/Controllers/EmailAvailabilityController.php`: the single action.
- `app/Http/Requests/EmailAvailabilityRequest.php`: the query validation.
- `web/services/user.api.ts`: `checkEmailAvailability` — the service call, parsed by Zod.
- `web/utils/emailRules.ts`: `accountEmailRules()` (write path — adds `lowercase` and the debounced availability rule) and `credentialEmailRules()` (read path — neither).

## Dependencies

- Feature 006: the rule is declared through `labeledRules` and renders through the same inline error path.
- Feature 005: the service uses the shared `fetcher` and `parseResponse`.
- Features 001–003: the `unique` rules this hint anticipates.

## Open Questions

## Tests

- `tests/Feature/EmailAvailabilityTest.php`: available; taken; taken-but-ignored via `ignore_id`; malformed email 422; missing email 422; over-length email 422; reachable without authentication.
- `web/utils/_tests/emailRules.spec.ts`: taken address invalidates; free address validates; a failing request leaves the field valid (fail-open); no request for an empty or malformed value; `ignoreId` forwarded; `credentialEmailRules` carries neither `lowercase` nor the availability check.
- `web/services/_tests/user.api.spec.ts`: the request shape (including `ignore_id` omitted when absent) and the parsed response.

## Verification

Backend and frontend suites green, including `EmailAvailabilityTest`, the `emailRules` specs and the `checkEmailAvailability` service spec; `nuxt typecheck`, `oxlint`, `oxfmt --check` and `pint --test` clean.

Live walk on the register page against real MySQL: a taken address rendered "The Email field is already taken." and blocked submit; a mixed-case address rendered the lowercase message; correcting both cleared every message and enabled Register. `/login` accepted a mixed-case address, confirming the read path carries neither rule.

Fail-open is covered by unit tests (500 and 429 both leave the field valid) rather than by the live walk; the production-only `uncompromised()` arm of the password policy is untested by design (feature 001, Tests).

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
