# Feature: Form Validation UX

## Status

Active

Demonstration contract — the rules live in `catalyst/stacks/frontend/nuxt/validation.md`; this document records how _this project_ wires client validation and folds server 422s back into the form.

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
| Inline field errors         | UI   | Regle messages + server errors rendered under each field by Vuetify's `error-messages`   |
| Suppressed validation toast | UX   | 422s handled inline are not also toasted (opted-in per form); non-422 errors still toast |
| Submit gating               | UX   | invalid forms block submission; a field clears its server error as the user edits it     |

## Scope And Non-Goals

In scope: Regle rules on each form mirroring backend constraints; the server-422-to-Regle bridge (`useValidationErrors` → `useExternalErrors` → the field's `error-messages`); Zod's response-only role; the per-form suppression of the validation toast.

Non-goals: the backend validation rules themselves (FormRequests, owned by features 001–003); the transport/error-routing layer (feature 005); using Zod for form validation (Zod validates responses only here); restating the stack-module rules.

## User / System Behavior

- Each form declares Regle rules that mirror the backend (e.g. `required`, `email`, `minLength(8)`, `maxLength(255)`, `sameAs`, `requiredIf`) so the user gets feedback before a round-trip.
- Mirroring runs through shared factories, never per-form literals: `newPasswordRules()` carries the 8–255 password pair; `emailRules.ts` splits the email rules the way the backend does — `accountEmailRules(ignoreId?)` for endpoints that _write_ a user (register, users, profile: adds `lowercase` and feature 008's debounced availability check), `credentialEmailRules()` for those that _read_ one (login, forgot-password, reset: neither rule).
- On this branch the email factories are not wired in yet: `newPasswordRules()` is shared, so the password bounds apply, but the auth dialogs and `password-reset.vue` still declare email rules inline (`{ required, email }`, some without `labeledRules`) and carry the drift the factories exist to prevent — no `lowercase` mirror, no availability check, and `maxLength(255)` missing where the endpoint enforces it. Porting them is open work, tracked in the to-do list.
- Client messages are localized and name the field: each field's rules are wrapped by `labeledRules(labelKey, rules)`, resolving `validation.field.*` copy with the field's `common.fields.*` label ("The Email field is required."). `web/regle-config.ts` supplies generic `validation.*` fallbacks for any unwrapped rule, including an explicit `requiredIf` entry — Regle matches messages by the declared rule key, not the rule's type. Both layers resolve `t` lazily, so an open form's errors follow a locale switch.
- On submit, an invalid form is blocked client-side; a valid form calls its mutation.
- When the server returns 422, `useValidationErrors` derives a field-keyed map from the mutation's `error` ref; `useExternalErrors` copies that map into a ref Regle owns as its `externalErrors` modifier. Regle clears each entry as the user edits that field — which is why the source is copied, not shared.
- Every field binds `:error-messages="r$.<field>.$errors"`, so Vuetify renders the combined Regle + external messages under the input itself — this branch has no shared error component.
- Client rules may be deliberately stricter than the server: the profile form marks `name`/`email` required, so the UI never issues a true partial update even though `PUT /api/profile` allows one (recorded in feature 003).

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

- `web/regle-config.ts` — the `@regle/nuxt` setup file: localized fallback messages for the built-in rules.
- `web/utils/labeledRules.ts` — wraps one field's rules with copy naming that field (`common.fields.*` label key); `emailRules.ts`, `newPasswordRules.ts` — the shared mirroring factories.
- `web/composables/useValidationErrors.ts` → `useExternalErrors.ts` — the bridge: a field-keyed map from a mutation's `error` ref, mirrored into a Regle-owned `externalErrors` ref.
- Per-form Regle schemas in the auth dialogs (`web/components/users/`) and the profile/users/password-reset pages; `web/utils/getValidationErrors.ts`; `web/types/*` Zod schemas (response validation). Rendering is Vuetify's: each input takes the field's `$errors` on its `error-messages` prop.

## Dependencies

- Feature 005: mutations expose the `error` ref the bridge reads; the central handler owns non-422 routing.
- Features 001–003: the backend FormRequest rules the client mirrors and the 422 shapes it consumes.
- `@regle/*` for form validation; `zod` for response schemas.

## Open Questions

## Tests

- `web/utils/_tests/` — `getValidationErrors` (the 422-to-field-map extraction); `newPasswordRules` and `emailRules`, driven through a real Regle instance rather than asserting rule objects: validity per mode (required, optional, the create/edit switch), both length bounds on both sides (7/8, 255/256), `lowercase`, the availability check invalidating a taken address and naming the field, failing open on a 500 and a 429, skipping empty or malformed values, `ignoreId` forwarded, and `credentialEmailRules` carrying neither `lowercase` nor the availability call; `labeledRules` (field-named and parameterized copy, locale switching on an open form, pass-through for unknown rules); `handleApiError` (the `hideValidationToast` path keeping a 422 inline, including a 422 carrying no field errors).
- `web/_tests/regle-config.spec.ts` — the generic catalog fallbacks bare rules get, including the `requiredIf` key that would otherwise fall back to the library's hardcoded English.
- `web/composables/_tests/` — the bridge itself (`useValidationErrors`, `useExternalErrors`): the empty map a form binds to before anything has failed, server errors arriving, the copy-not-share that lets Regle clear an entry without reaching back into the source, replacement on a differently-failing submit, and a getter source.
- `web/components/users/_tests/` — the per-form schemas at component level, across `UserFormDialog`, `UserCard` and the three auth dialogs: the password rules switching with the mode, `sameAs` and the length bounds, a disabled confirmation refusing an incomplete form, and a server 422 landing on its own field rather than in a toast.
- Known gaps (recorded): on this branch only the password pair reaches `labeledRules`, through `newPasswordRules`; every other field still shows the generic `validation.*` copy until each form passes its `common.fields.*` label — deferred with the rest of the component work.

## Verification

Traced against source: the bridge chain (`useValidationErrors` → `useExternalErrors`, copied-not-shared so Regle can clear on edit) and the `error-messages` binding on each field; the stricter-client asymmetry cross-checked against feature 003. Frontend suite green at its last recorded run, including the per-form component specs.

The live walk of the field-named localized messages ran on `master`'s UI — this branch shares the helpers, not the forms, so the component specs stand in for it here. Component-level gaps and the unwired email factories stand as recorded.

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
