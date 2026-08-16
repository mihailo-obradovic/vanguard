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
| Inline field messages | UI | localized, field-named copy rendered under the input by Vuetify's `error-messages` |
| Submit gating         | UX | an invalid form blocks submission client-side; a valid one calls its mutation      |

## Scope And Non-Goals

In scope: the Regle rules each form declares to mirror the backend, the shared factories they come from, the localized field-named copy those rules carry, Zod's response-only role, and the dialog-form trio that decides reset timing.

Non-goals: the server-422 bridge and the toast opt-out (feature 010); the backend validation rules themselves (FormRequests, features 001–003); the transport and error-routing layer (feature 005); using Zod for form validation; restating the stack-module rules.

## User / System Behavior

- Each form declares Regle rules that mirror the backend (e.g. `required`, `email`, `minLength(8)`, `maxLength(255)`, `sameAs`, `requiredIf`) so the user gets feedback before a round-trip.
- Mirroring runs through shared factories, never per-form literals: `nameRules()` carries the required 255-max display name; `newPasswordRules()` carries the 8–255 password pair; `emailRules.ts` splits the email rules the way the backend does — `accountEmailRules(ignoreId?)` for endpoints that _write_ a user (register, users, profile: adds `lowercase` and feature 008's debounced availability check), `credentialEmailRules()` for those that _read_ one (login, forgot-password, reset: neither rule).
- Every form takes its email rules from these factories rather than declaring its own; the account forms pass `ignoreId` for the user being edited (register passes none — nobody owns the address yet), and excluding the subject is what lets a form whose address never changed still save.
- The availability rule is debounced 500ms, and the debounce covers the field's synchronous rules too, so on an account form a malformed address is reported a beat after typing rather than immediately. Since every dialog binds `:confirm-disabled="r$.$invalid"`, the confirmation is also disabled while the check is in flight — a deliberate trade for catching a taken address before the round-trip.
- Client messages are localized and name the field: each field's rules are wrapped by `labeledRules(nameKey, rules)`, resolving `validation.field.*` copy with the field's `validation.fieldNames.*` name ("The email field is required."). Every field a user can see does this, so one form never mixes the two voices. That name is a catalog entry of its own, not the `common.fields.*` label the input renders: English drops it mid-sentence, lowercase, matching what Laravel's own 422 sends for that field, while the label is capitalized — and Serbian, quoting the name, keeps the label's casing. No transform serves both. `web/regle-config.ts` supplies generic `validation.*` fallbacks for any rule that is not wrapped, including an explicit `requiredIf` entry — Regle matches messages by the declared rule key, not the rule's type. Both layers resolve `t` lazily, so an open form's errors follow a locale switch. The name always matches the label on screen: `newPasswordRules()` derives its name keys from its `optional` flag, so a change-password form's messages say "new password" / "confirm new password" rather than naming the "password" of a set-password form — `nameKey` accepts a getter so the switch follows a create/edit mode flip at runtime.
- On submit, an invalid form is blocked client-side; a valid form calls its mutation.
- Dialog forms run their cancel, validate-then-submit and reset through `useDialogForm`, so the reset-timing rule is decided in one place: a form whose fresh state is constant resets from the dialog's after-close hook (nothing, passwords included, lingers while it is shut); a form whose fresh state depends on props the parent assigns right before opening resets on open instead, and declares itself as such by passing `initialState`. The submitted payload is always a copy of the form, never the ref the reset then blanks.
- Every field binds `:error-messages="r$.<field>.$errors"`, so Vuetify renders its Regle messages and the server errors feature 010 supplies in one place under the input — this branch has no shared error component, and the user never has to tell the two sources apart.
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

- The profile form sends `current_password` only when a new password is being set — a present-but-empty value is validated against the stored hash and rejected (feature 003).

## Invariants

- Zod validates responses, Regle validates form input — the two never swap roles.
- A form's rules come from the shared factories, never from per-form literals that could drift from the backend.

No protected area of its own — the backend validation contracts are owned by features 001–003.

## Error Handling

- A rule the client checks fails before any request is made; nothing reaches the network.
- A constraint only the server knows returns 422 and is handled by feature 010; every other status is feature 005's.

## Entry Points

- `web/regle-config.ts` — the `@regle/nuxt` setup file: localized fallback messages for the built-in rules.
- `web/utils/labeledRules.ts` — wraps one field's rules with copy naming that field (`validation.fieldNames.*` key); `nameRules.ts`, `emailRules.ts`, `newPasswordRules.ts` — the shared mirroring factories, each labelling its own.
- `web/composables/useDialogForm.ts` — a dialog form's cancel / confirm / reset trio, and the single place the reset timing is decided; `useMutationDialog.ts` — the owner's side of the same dialog: the open flag and the close on success.
- Per-form Regle schemas in the auth dialogs (`web/components/users/`) and the profile/users/password-reset pages; `web/types/*` Zod schemas (response validation).

## Dependencies

- Feature 010: renders the server's own verdict on the same fields these rules guard.
- Features 001–003: the backend FormRequest rules the client mirrors.
- Feature 008: the debounced availability rule the account email factory carries.
- `@regle/*` for form validation; `zod` for response schemas.

## Open Questions

## Tests

- `web/utils/_tests/` — `nameRules` (required, the 255/256 bound both sides, the labelled message it single-sources); `newPasswordRules` and `emailRules`, driven through a real Regle instance rather than asserting rule objects: validity per mode (required, optional, the create/edit switch), the mode-appropriate field names in the copy (including across a runtime mode flip), both length bounds on both sides (7/8, 255/256), `lowercase`, the availability check invalidating a taken address and naming the field, failing open on a 500 and a 429, skipping empty or malformed values, `ignoreId` forwarded, and `credentialEmailRules` carrying neither `lowercase` nor the availability call; `labeledRules` (field-named and parameterized copy, locale switching on an open form, pass-through for unknown rules).
- `web/_tests/regle-config.spec.ts` — the generic catalog fallbacks bare rules get, including the `requiredIf` key that would otherwise fall back to the library's hardcoded English.
- `web/composables/_tests/` — `useDialogForm`: cancel, submit gated on validation and carrying a copy rather than the form ref, both reset timings each ignoring the other's trigger, and the extra state `onReset` clears. `useMutationDialog`: the close on success landing before the owner's own handler.
- `web/components/users/_tests/` — the per-form schemas at component level, across `UserFormDialog`, `UserCard`, `UserDetailsDialog` and the three auth dialogs: the password rules switching with the mode, `sameAs` and the length bounds, a disabled confirmation refusing an incomplete form, and each form's factory adoption pinned by what distinguishes it — the length bound on the credential forms, the outgoing availability request on the account forms, and the `ignore_id` wherever a subject must be excluded.
- Known gap (recorded): `password-reset.vue`'s `token` rule stays unlabelled — its hidden input binds no `error-messages`, so the message is never rendered; a bad token returns a 422 on the visible email field instead.

## Verification

Traced against source: the shared factories each form adopts, and the `error-messages` binding on each field; the stricter-client asymmetry cross-checked against feature 003. Frontend suite green at its last recorded run (50 files, 416 tests), including the per-form component specs.

Walked live on this branch on 2026-08-16 against real MySQL, which closed the standing risk the factory wiring left. In the register dialog, `ana@` renders "The email field must be a valid email address." on one line under the input, `test@example.com` renders "The email field is already taken." with the confirmation disabled, and `TEST@Example.com` renders "The email field must be lowercase." (the field name was title case when walked, lowercased since; the current copy is pinned by the component specs) — both account-only rules wired, and the field-named copy rendering rather than a raw key. The debounce measured **843ms** from keystroke to the message clearing (the 500ms timer plus the round trip), with the confirmation disabled throughout instead of flickering. `/login` still accepts a mixed-case address, so the read path carries neither rule, and a locale switch re-renders the chrome and messages. `ignore_id` was read off the wire rather than inferred: `ignore_id=1` for the signed-in user from the profile card, `ignore_id=46` for the user being edited from the user dialog, and a name-only edit there saved `200` with its address untouched.

The walk also surfaced a pre-existing defect (the profile card always sent `current_password`, refusing name-only saves 422), since fixed under feature 003. Component-level gaps stand as recorded.

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
