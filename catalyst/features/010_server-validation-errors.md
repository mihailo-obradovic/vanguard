# Feature: Server Validation Errors Inline

## Status

Active

Split out of feature 006 — 006 owns what the client checks before a request is sent; this document owns what happens to the server's verdict when one comes back 422.

## Task Weight

Medium

## Purpose

Put a backend validation error on the field that caused it. Without this the only place a 422 could surface is the central toast, which names a field the user then has to go find — and which disappears while the form is still wrong.

## Inputs

| Input           | Type       | Source                           | Constraints                                         |
| --------------- | ---------- | -------------------------------- | --------------------------------------------------- |
| Server 422 body | JSON       | API via a mutation's `error` ref | `{ errors: { field: [messages] } }` — Laravel shape |
| Opt-in flag     | option     | a mutation's `errorHandling`     | `hideValidationToast` — per form, default off       |
| Field edits     | form state | the form the bridge is bound to  | Regle clears an entry as its field is edited        |

## Outputs And Side Effects

| Output / Side Effect        | Type | Description                                                                               |
| --------------------------- | ---- | ----------------------------------------------------------------------------------------- |
| Field-keyed error map       | data | `useValidationErrors` derives it from the mutation's `error` ref; `{}` when there is none |
| Regle `externalErrors` ref  | data | `useExternalErrors` copies the map into a ref Regle owns and may clear                    |
| Inline field errors         | UI   | the copied messages render under the field beside Regle's own                             |
| Suppressed validation toast | UX   | a 422 handled inline is not also toasted; every other status still toasts                 |

## Scope And Non-Goals

In scope: extracting the field map from a 422 (`getValidationErrors`); the `useValidationErrors` → `useExternalErrors` → rendered-error chain; the per-form `hideValidationToast` opt-out; what happens to an entry when its field is edited.

Non-goals: the client-side rules and their copy (feature 006); routing any status other than 422, which is the central handler's (feature 005); the backend rules that produce the 422 (features 001–003).

## User / System Behavior

- When a mutation fails 422, `useValidationErrors` derives a field-keyed map from its `error` ref. No error, or an error that is not a 422, yields an empty map.
- `useExternalErrors` **copies** that map into a ref handed to Regle as its `externalErrors` modifier. Copied rather than shared, because Regle clears entries in that ref as the user edits — writing back into the mutation's error would mean mutating another layer's state.
- Each field renders its combined Regle and external messages together, so a server error and a client error occupy the same place under the input and the user never has to tell them apart.
- Editing a field clears its server-supplied error. The next failing submit replaces the whole map, so errors from an earlier attempt cannot linger beside a fresh verdict.
- A form opts into the inline path by passing `hideValidationToast` on its mutation. Without it, `handleApiError` toasts the 422 like any other failure — the inline path is opt-in, never assumed.

## Roles And Access

Not role-specific — the bridge applies to every form regardless of role.

## Examples

| Input                             | Expected Output                           | Notes                                        |
| --------------------------------- | ----------------------------------------- | -------------------------------------------- |
| Server 422 on `email` (duplicate) | inline error on the email field, no toast | the opted-in path                            |
| Edit the errored field            | its server error clears                   | Regle owns `externalErrors`, clears on edit  |
| A second submit fails differently | the previous field errors are gone        | the map is replaced, not merged              |
| 422 on a form that did not opt in | central toast, nothing inline             | opt-in, so an unprepared form still says why |
| Non-422 failure (e.g. 500)        | central toast                             | the inline path is 422-only                  |

## Business Rules

- Inline 422 rendering and toast suppression are opt-in per form; a form that does not opt in falls back to the central toast rather than failing silently.
- The bridge copies the server's map; it never writes back into the mutation's `error`.

## Edge Cases

- A 422 carrying no field errors leaves the map empty; with `hideValidationToast` set, the form shows nothing rather than a toast — the client rules are expected to have caught anything the user can act on.
- A 422 for a field the form does not render has no inline home. Forms are expected to cover the fields they submit.

## Invariants

- Server validation errors surface on the field that caused them, not only as a toast.
- Editing a field clears its server-supplied error (Regle owns `externalErrors`).
- The bridge is null-safe: no error ref ⇒ empty map ⇒ no inline errors.

No protected area of its own — the 422 shapes it consumes are owned by features 001–003.

## Error Handling

- 422 → field-keyed inline errors, toast suppressed on opted-in forms.
- Every other status → central handling (feature 005). The bridge does not see it.

## Entry Points

- `web/utils/getValidationErrors.ts` — the 422-to-field-map extraction.
- `web/composables/useValidationErrors.ts` → `useExternalErrors.ts` — the bridge: a field-keyed map from a mutation's `error` ref, mirrored into a Regle-owned `externalErrors` ref.
- `web/components/_shared/UIField.vue` — the field primitive: renders the first combined Regle + server message under the control, and points the control at it (`aria-describedby`, `aria-invalid`).
- `web/utils/handleApiError.ts` — the `hideValidationToast` opt-out that keeps a 422 off the toast.

## Dependencies

- Feature 005: mutations expose the `error` ref the bridge reads, and the central handler owns every non-422 status.
- Feature 006: the Regle instance whose `externalErrors` modifier the bridge feeds.
- Features 001–003: the backend rules that produce the 422 bodies.

## Open Questions

## Tests

- `web/utils/_tests/getValidationErrors.spec.ts` — the extraction: a Laravel 422 body, a non-422 error, a missing error, and a malformed entry.
- `web/utils/_tests/handleApiError.spec.ts` — the `hideValidationToast` path keeping a 422 inline, including a 422 carrying no field errors.
- `web/composables/_tests/` — the bridge itself (`useValidationErrors`, `useExternalErrors`): the empty map a form binds to before anything has failed, server errors arriving, the copy-not-share that lets Regle clear an entry without reaching back into the source, replacement on a differently-failing submit, and a getter source.
- Per-form coverage that a server 422 lands on its own field rather than in a toast lives with the form specs (feature 006).

## Verification

Traced against source at the split: the chain (`useValidationErrors` → `useExternalErrors`, copied-not-shared so Regle can clear on edit) and the rendering of the combined messages under each field. Suite green at its last recorded run, including the composable specs named above.

Behavior is unchanged by the split — no code moved, only this contract out of 006 — so the evidence recorded there before the split stands for this document.

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
