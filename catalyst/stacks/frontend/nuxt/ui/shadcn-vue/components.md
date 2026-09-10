# shadcn-vue Composition Patterns

What to reach for, what to compose, and the few things that stay this project's own.

## Which primitives earn their place

Three questions, in order:

1. **Does the registry have it?** Then vendor it. `Button`, `Dialog`, `Input`, `Label`, `Field`, `Select`, `Table`, `AlertDialog`, `Badge`, `Sonner` — all of it is source you own, and hand-rolling an equivalent is strictly worse.
2. **Is it a repeated composition of vendored parts?** Then it is a project component in `web/components/_shared/` (`FormDialog` is the canonical example: `Dialog` + `Button` + a submit-state contract, used by every mutation dialog). Not a wrapper for consistency — a wrapper for behaviour that would otherwise be retyped.
3. **Is it a rule the registry has no opinion about?** Then it stays project-owned, and stays even after the conversion finishes. Two of these exist:
   - **`UIReservedLabel`** — the layout-stability rule (`../../../_common/layout-stability.md`). Nothing upstream reserves space for text that changes with state.
   - **`UIScrollArea`** — the scroll-affordance rule (`../../../_common/scroll-affordance.md`), built on `web/utils/scrollEdges.ts`. The registry's `scroll-area` is a Reka wrapper with no edge-rule affordance, so it is not a replacement.

Anything else that survives the conversion needs a comment saying why.

## Dialogs

The composition is layout-hosted state, not route state: a dialog's open flag lives where the dialog is mounted, `v-model` binds it, and hand-off between dialogs goes through emitted events — each dialog closes itself _before_ emitting, so two overlays never animate at once.

- **`useMutationDialog`** owns the open flag and the mutation(s) behind it, and suppresses validation toasts so 422s render on the field instead. Its `afterLeave()` clears the dialog's subject only once the close transition has finished — Reka UI's `Presence` `after-leave`, surfaced by `FormDialog` as an emit — so a subject-bound title does not blank mid-fade. `useDialogForm` holds the form state inside.
- **`useConfirmOnEnter`** gives a dialog its Enter-to-confirm behaviour, skipping keypresses from elements that already act on Enter (`button, a, textarea, select`). Reka's `Select` trigger renders a `<button>`, so it is already covered.
- **`AlertDialog`, not `Dialog`,** for destructive confirmation. It carries the right role and focus defaults; a `Dialog` with a red button does not.
- `after-leave` is not testable in happy-dom (no animation engine) — verify it in a browser and say so, rather than writing a test that passes for the wrong reason.

## Forms: `ui/field` with Regle

`Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldGroup` are validation-library-agnostic. Regle drives them directly:

- `Field` takes `:data-invalid`, the control takes `:aria-invalid`, `FieldError` renders the messages. That wiring is the component's job — do not reimplement it in a wrapper.
- **`FieldLabel` carries the field's name only.** "Optional" and other guidance belong in `FieldDescription` — see the Field label / Field name distinction in `context/domain-glossary.md`.
- Server-side 422 messages land on the field, not in a toast (`../../validation.md`).
- **Not `ui/form`**: it is built for vee-validate, which this project does not use and would not benefit from adding.

## Toasts

`$toast(message, type, options)` (`web/utils/toast.ts`) is the seam, and it stays the seam — call sites never import the toast library directly. Behind it sits `vue-sonner`, styled through the vendored `ui/sonner` `Toaster`, which is mounted **once** at the app root.

Central error routing goes through `handleApiError.ts`, not through call sites: a mutation that fails raises its toast because the query layer routed it there. A component toasting an error it did not handle is duplicating that path.

Success toasts are the component's business; failure toasts are the error layer's.

## Tables

Vendor `ui/table` and use its parts (`Table`, `TableHeader`, `TableRow`, `TableCell`) rather than a raw `<table>` with project classes — the vendored parts carry the border, spacing, and hover tokens that make a table look like the rest of the app.

A table that must not grow the page gets the **table height cap** (`../../page-layout.md`): the flexbox form, a `min-height: 0` chain with a sticky header, never a measured `max-height`.

## Styling

Utilities in the template; `<style scoped>` only when a utility genuinely cannot express it (a keyframe, a complex selector) — and then over the theme variables, never a literal colour. A vendored component's variants live in its `cva` config: add a variant there rather than passing a pile of overriding classes at every call site.

## Specs

Assert **behaviour** — rendered labels and roles, emitted events, the mutation called with the right payload — not DOM structure. Structure-coupled assertions break on every primitive swap and survive mutation testing poorly; they inflate coverage without proving anything. Query by role and accessible name wherever the vendored component provides one, which for Reka-backed components is almost always.
