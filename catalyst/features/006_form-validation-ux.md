# Feature: Form Validation UX

## Status

Active

Retro-documented at brownfield adoption (2026-08-04) from code. **Demonstration contract** — the rules live in `catalyst/stacks/frontend/nuxt/validation.md`; this document records how _this project_ wires client validation and folds server 422s back into the form.

## Task Weight

Medium

## Purpose

Give forms immediate, inline validation feedback and render backend validation errors on the offending field rather than as a disconnected toast — so the client and server agree on what is valid and the user always sees the error where they can fix it.

## Inputs

| Input           | Type       | Source                             | Constraints                                           |
| --------------- | ---------- | ---------------------------------- | ----------------------------------------------------- |
| Field values    | form state | login/register/profile/users forms | validated by Regle rules mirroring the backend        |
| Server 422 body | JSON       | API via a mutation's `error` ref   | `{ errors: { field: [messages] } }` — Laravel shape   |
| API response    | JSON       | `fetcher` → `parseResponse`        | validated by Zod (response-only, not form validation) |

## Outputs And Side Effects

| Output / Side Effect        | Type | Description                                                                              |
| --------------------------- | ---- | ---------------------------------------------------------------------------------------- |
| Inline field errors         | UI   | Regle messages + server errors rendered under each field via `FieldErrors.vue`           |
| Suppressed validation toast | UX   | 422s handled inline are not also toasted (opted-in per form); non-422 errors still toast |
| Submit gating               | UX   | invalid forms block submission; a field clears its server error as the user edits it     |

## Scope And Non-Goals

In scope: Regle rules on each form mirroring backend constraints; the server-422-to-Regle bridge (`useValidationErrors` → `useExternalErrors` → `FieldErrors.vue`); Zod's response-only role; the per-form suppression of the validation toast.

Non-goals: the backend validation rules themselves (FormRequests, owned by features 001–003); the transport/error-routing layer (feature 005); using Zod for form validation (Zod validates responses only here); restating the stack-module rules.

## User / System Behavior

- Each form declares Regle rules that mirror the backend (e.g. `required`, `email`, `minLength(8)`, `maxLength(255)`, `sameAs`, `requiredIf`) so the user gets feedback before a round-trip.
- **Mirroring is done by shared factories, not per-form literals**, because a rule copied into six pages drifts in one of them. `newPasswordRules()` carries the 8–255 password pair; `emailRules.ts` splits the email rules the way the backend splits them — `accountEmailRules(ignoreId?)` for the endpoints that _write_ a user (register, users, profile: adds `lowercase` and the debounced availability check of feature 008) and `credentialEmailRules()` for those that _read_ one (login, forgot-password, reset: neither rule, since the column collates case-insensitively and the address is meant to already exist).
- Client messages are localized and name the field: each field's rules are wrapped by `labeledRules(labelKey, rules)`, which resolves `validation.field.*` copy with the field's `common.fields.*` label ("The Email field is required."). `web/regle-config.ts` overrides the library's built-in messages with generic `validation.*` catalog copy as the fallback for any unwrapped rule — including a `requiredIf` entry, because Regle matches messages by the declared rule key, not the rule's type. Both layers resolve `t` lazily, so an open form's errors follow a locale switch.
- On submit, an invalid form is blocked client-side; a valid form calls its mutation.
- When the server returns 422, `useValidationErrors` derives a field-keyed map from the mutation's `error` ref; `useExternalErrors` copies that map into a ref Regle owns as its `externalErrors` modifier. Regle clears each entry as the user edits that field — which is why the source is copied, not shared.
- `FieldErrors.vue` renders the combined Regle + external errors under the field. The validation toast is suppressed for forms that opt into inline handling; non-422 errors still toast centrally (feature 005).
- Client rules may be **stricter** than the server (deliberate): e.g. the profile form marks `name`/`email` required, so the UI never issues a true partial update even though `PUT /api/profile` allows one (recorded in feature 003).

## Roles And Access

Not role-specific — validation UX applies to every form regardless of role.

## Examples

| Input                             | Expected Output                           | Notes                                                 |
| --------------------------------- | ----------------------------------------- | ----------------------------------------------------- |
| Empty required field, blur        | inline "required" message                 | Regle, no network call                                |
| Password mismatch on register     | inline error on confirmation              | Regle `sameAs`                                        |
| Server 422 on `email` (duplicate) | inline error on the email field, no toast | bridged via `useValidationErrors`/`useExternalErrors` |
| Edit the errored field            | its server error clears                   | Regle owns `externalErrors`, clears on edit           |
| Non-422 failure (e.g. 500)        | central toast                             | inline path is 422-only                               |

## Business Rules

- Regle rules mirror the backend contract; where they intentionally diverge (stricter client), that divergence is documented in the owning feature.
- Zod is response-only — it never drives form validation.
- Inline 422 rendering and toast suppression are opt-in per form; forms that do not opt in fall back to the central toast.

## Edge Cases

- The profile form always sends `current_password` (possibly `""`); Laravel skips non-implicit rules on empty strings, so name-only saves pass (feature 003).
- A server 422 for a field the form does not render would have no inline home — forms are expected to cover the fields they submit.

## Invariants

- Server validation errors surface on the field that caused them, not only as a toast.
- Editing a field clears its server-supplied error (Regle owns `externalErrors`).
- Zod validates responses, Regle validates form input — the two never swap roles.

No protected area of its own — the backend validation contracts are owned by features 001–003.

## Error Handling

- 422 → field-keyed inline errors (toast suppressed on opted-in forms); every other status → central handling (feature 005).
- The bridge is null-safe: no error ref ⇒ empty error map ⇒ no inline errors.

## Entry Points

- `web/regle-config.ts`: the `@regle/nuxt` setup file — localized fallback messages for the built-in rules.
- `web/utils/labeledRules.ts`: wraps one field's rules with copy naming that field; forms pass it a `common.fields.*` label key.
- `web/composables/useValidationErrors.ts`: derives a field-keyed map from a mutation's `error` ref.
- `web/composables/useExternalErrors.ts`: mirrors that map into a Regle-owned `externalErrors` ref.
- `web/components/shared/FieldErrors.vue`: renders combined Regle + server errors under a field.
- Per-form Regle schemas in the auth/profile/users pages; `web/utils/getValidationErrors.ts`; `web/types/*` Zod schemas (response validation).

## Dependencies

- Feature 005: mutations expose the `error` ref the bridge reads; the central handler owns non-422 routing.
- Features 001–003: the backend FormRequest rules the client mirrors and the 422 shapes it consumes.
- `@regle/*` for form validation; `zod` for response schemas.

## Open Questions

## Tests

- `web/utils/_tests/getValidationErrors.spec.ts` — the 422-to-field-map extraction.
- `web/utils/_tests/newPasswordRules.spec.ts` — the shared password/confirmation rules driven through a real Regle instance, asserting validity per mode (required, optional, and the runtime create/edit switch) rather than the rule objects; also pins the confirmation's field-named message and both length bounds on both sides (7/8, 255/256).
- `web/utils/_tests/emailRules.spec.ts` — the two factories driven through a real Regle instance: the availability check invalidating a taken address and naming the field, the fail-open contract under a 500 and a 429, `lowercase`, the 255 bound, no request for an empty or malformed value, `ignoreId` forwarded, and `credentialEmailRules` carrying neither `lowercase` nor the availability call.
- `web/utils/_tests/labeledRules.spec.ts` — field-named copy, parameterized messages, locale switching on an open form, and the pass-through for rules it has no message for.
- `web/_tests/regle-config.spec.ts` — the generic catalog fallbacks bare rules get, including the `requiredIf` key that would otherwise fall back to the library's hardcoded English.
- `web/utils/_tests/handleApiError.spec.ts` — the `hideValidationToast` path that keeps a 422 inline instead of toasting it, including the fallback when a 422 carries no field errors.
- `web/composables/_tests/useExternalErrors.spec.ts` and `useValidationErrors.spec.ts` — the bridge itself: the empty map a form binds to before anything has failed, the server errors arriving, the copy-not-share that lets Regle clear an entry without reaching back into the source, replacement on a differently-failing submit, and a getter source.
- Known gaps (recorded): the per-form Regle schemas have no component tests — they live in pages, which stay on the live browser walk per `decisions/008`. `FieldErrors.vue` is deliberately untested (it renders `errors[0]` of a prop array and holds no logic); both decisions are recorded per-file in `operations.md`.

## Verification

Traced against source on 2026-08-04: the bridge chain (`useValidationErrors` → `useExternalErrors`, copied-not-shared so Regle can clear on edit) and `FieldErrors.vue`; the stricter-client asymmetry cross-checked against feature 003. Frontend unit suite green at adoption (`getValidationErrors` spec). Component-level test gaps stand as recorded.

2026-08-13, field-named localized messages: register form walked live — email/minLength/sameAs errors render with field labels and re-render across en / sr-Latn / sr-Cyrl on a locale switch with the form open; suite green (labeledRules, newPasswordRules, regle-config, locales specs).

2026-08-15, mirroring moved into shared factories (`newPasswordRules` gains `maxLength(255)`; `accountEmailRules`/`credentialEmailRules` split the email rules the way the backend does): 264 frontend tests green, `nuxt typecheck` and `oxlint` clean. Register walked live — the lowercase and availability messages render inline before any submit and clear on correction; `/login` accepts a mixed-case address, confirming the read path deliberately carries neither rule. Two drifts this closed: the client never mirrored `lowercase`, so an uppercase address was promised valid and then 422'd, and three forms lacked the `maxLength(255)` their endpoints enforce.

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
