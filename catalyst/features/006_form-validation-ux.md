# Feature: Form Validation UX

## Status

Active

Demonstration contract — the rules live in `catalyst/stacks/frontend/nuxt/validation.md`; this document records how _this project_ wires client validation. What the server's own verdict does when it comes back 422 is feature 010.

## Task Weight

Medium

## Purpose

Give forms immediate, inline feedback that mirrors the backend's own constraints, so the user learns a value is wrong before spending a round-trip on it — and in copy that names the field, in their own language.

## Inputs

| Input           | Type       | Source                             | Constraints                                           |
| --------------- | ---------- | ---------------------------------- | ----------------------------------------------------- |
| Field values    | form state | login/register/profile/users forms | validated by Regle rules mirroring the backend        |
| API response    | JSON       | `fetcher` → `parseResponse`        | validated by Zod (response-only, not form validation) |

## Outputs And Side Effects

| Output / Side Effect        | Type | Description                                                                              |
| --------------------------- | ---- | ---------------------------------------------------------------------------------------- |
| Inline field messages | UI | localized, field-named copy rendered under the input as the user types or blurs |
| Submit gating         | UX | an invalid form blocks submission client-side; a valid one calls its mutation   |

## Scope And Non-Goals

In scope: the Regle rules each form declares to mirror the backend, the shared factories they come from, the localized field-named copy those rules carry, and Zod's response-only role.

Non-goals: the server-422 bridge and the toast opt-out (feature 010); the backend validation rules themselves (FormRequests, features 001–003); the transport and error-routing layer (feature 005); using Zod for form validation; restating the stack-module rules.

## User / System Behavior

- Each form declares Regle rules that mirror the backend (e.g. `required`, `email`, `minLength(8)`, `maxLength(255)`, `sameAs`, `requiredIf`) so the user gets feedback before a round-trip.
- Mirroring runs through shared factories, never per-form literals: `newPasswordRules()` carries the 8–255 password pair; `emailRules.ts` splits the email rules the way the backend does — `accountEmailRules(ignoreId?)` for endpoints that _write_ a user (register, users, profile: adds `lowercase` and feature 008's debounced availability check), `credentialEmailRules()` for those that _read_ one (login, forgot-password, reset: neither rule).
- Client messages are localized and name the field: each field's rules are wrapped by `labeledRules(nameKey, rules)`, resolving `validation.field.*` copy with the field's `validation.fieldNames.*` name ("The email field is required."). That name is a second catalog entry rather than the `common.fields.*` label the input renders, because the two sit in different positions: English drops the name mid-sentence, where it is lowercase and matches the wording Laravel's own 422 sends for the same field, while the label is capitalized; Serbian sets the name in quotation marks and keeps the label's casing. A transform in code could not serve both. `web/regle-config.ts` supplies generic `validation.*` fallbacks for any unwrapped rule, including an explicit `requiredIf` entry — Regle matches messages by the declared rule key, not the rule's type. Both layers resolve `t` lazily, so an open form's errors follow a locale switch.
- On submit, an invalid form is blocked client-side; a valid form calls its mutation.
- A field renders its Regle messages and the server errors feature 010 supplies in the same place, so the user never has to tell the two sources apart.
- Client rules may be deliberately stricter than the server: the profile form marks `name`/`email` required, so the UI never issues a true partial update even though `PUT /api/profile` allows one (recorded in feature 003).

## Roles And Access

Not role-specific — validation UX applies to every form regardless of role.

## Examples

| Input                             | Expected Output                           | Notes                                                 |
| --------------------------------- | ----------------------------------------- | ----------------------------------------------------- |
| Empty required field, blur        | inline "required" message                 | Regle, no network call                                |
| Password mismatch on register     | inline error on confirmation              | Regle `sameAs`                                        |
| Address typed in mixed case       | inline "must be lowercase" on an account form | the write path only; `/login` accepts it         |

## Business Rules

- Regle rules mirror the backend contract; where they intentionally diverge (stricter client), that divergence is documented in the owning feature.
- Zod is response-only — it never drives form validation.
- Every field a user can see carries the field-named copy, so one form never mixes that voice with the generic fallbacks.

## Edge Cases

- The profile form always sends `current_password` (possibly `""`); Laravel skips non-implicit rules on empty strings, so name-only saves pass (feature 003).

## Invariants

- Zod validates responses, Regle validates form input — the two never swap roles.
- A form's rules come from the shared factories, never from per-form literals that could drift from the backend.

No protected area of its own — the backend validation contracts are owned by features 001–003.

## Error Handling

- A rule the client checks fails before any request is made; nothing reaches the network.
- A constraint only the server knows returns 422 and is handled by feature 010; every other status is feature 005's.

## Entry Points

- `web/regle-config.ts` — the `@regle/nuxt` setup file: localized fallback messages for the built-in rules.
- `web/utils/labeledRules.ts` — wraps one field's rules with copy naming that field (`validation.fieldNames.*` key); `emailRules.ts`, `newPasswordRules.ts` — the shared mirroring factories.
- Per-form Regle schemas in the auth/profile/users pages; `web/types/*` Zod schemas (response validation).

## Dependencies

- Feature 010: renders the server's own verdict on the same fields these rules guard.
- Features 001–003: the backend FormRequest rules the client mirrors.
- Feature 008: the debounced availability rule the account email factory carries.
- `@regle/*` for form validation; `zod` for response schemas.

## Open Questions

## Tests

- `web/utils/_tests/` — `newPasswordRules` and `emailRules`, driven through a real Regle instance rather than asserting rule objects: validity per mode (required, optional, the create/edit switch), both length bounds on both sides (7/8, 255/256), `lowercase`, the availability check invalidating a taken address and naming the field, failing open on a 500 and a 429, skipping empty or malformed values, `ignoreId` forwarded, and `credentialEmailRules` carrying neither `lowercase` nor the availability call; `labeledRules` (field-named and parameterized copy, locale switching on an open form, pass-through for unknown rules).
- `web/_tests/regle-config.spec.ts` — the generic catalog fallbacks bare rules get, including the `requiredIf` key that would otherwise fall back to the library's hardcoded English.
- Known gap (recorded): the per-form Regle schemas have no component tests — they live in pages, which stay on the live browser walk per `decisions/013`, recorded per-file in `operations.md`.

## Verification

Traced against source: the shared factories each form adopts, and the stricter-client asymmetry cross-checked against feature 003. 265 frontend tests green, `nuxt typecheck` and `oxlint` clean.

Register walked live: the lowercase and availability messages render inline before any submit and clear on correction, and field-named errors re-render across en / sr-Latn / sr-Cyrl on a locale switch with the form open; `/login` accepts a mixed-case address, confirming the read path deliberately carries neither `lowercase` nor the availability check. Component-level test gaps stand as recorded.

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
