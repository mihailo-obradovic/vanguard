# Nuxt Validation

**Layer:** Frontend
**Tool:** Zod (responses) · Regle (requests)

Two libraries, two directions, no overlap. **Zod validates what comes in; Regle validates what goes out.** Neither is used for the other's job.

## Zod — responses only

Domain schemas live next to the types they produce in `@/types/`, and the **types are inferred from the schemas** — never hand-write a type a schema can infer:

```ts
export const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  role: z.enum(['user', 'admin']),
  created_at: z.string()
});

// APIs that wrap a single resource get an envelope schema alongside it.
export const UserEnvelopeSchema = z.object({ data: UserSchema });

export type User = z.infer<typeof UserSchema>;
```

- **Response-only schemas** — a `{ status: string }` acknowledgement used in one service file — stay at the top of that service file rather than polluting `@/types/`.
- **Request and form payload types stay hand-written.** They describe what the UI sends, not what the server returns, so there is no response to infer them from and no runtime parsing to do.
- Parsing happens once, at the service boundary (`data-layer.md`). A parse failure is a programming or contract error, not a user-facing one: log the Zod issue and throw a generic message rather than surfacing schema internals.

## Regle — requests only

Forms validate client-side with `@regle/core` + `@regle/rules`. **Rules mirror the backend's validation for that endpoint** — the same `required`, `email`, `maxLength(255)`, `minLength(8)`, `sameAs`, `requiredIf`. When they drift, the user meets a server error the form promised could not happen.

- The form component keeps a plain `ref` form model and calls `useRegle(form, rules, { externalErrors })`.
- Rules that depend on props (create mode vs edit mode) use a **rules getter** — `useRegle(form, () => ({ … }), …)` — so they re-evaluate when the props change.
- Inputs bind the field's errors; confirm buttons bind `r$.$invalid`; submit handlers `await r$.$validate()` before mutating.
- Dialogs call `r$.$reset()` when they close or reopen, so a cancelled edit does not leave errors behind.
- **No manual `isFormValid` computed.** Regle owns validity.

## Server 422s appear inline, not as toasts

A validation failure the form could have caught belongs on the field that caused it. The path from a mutation error to a field message has four pieces:

1. The mutation opts out of the validation toast — and only that toast:

   ```ts
   const { mutate, error } = useUpdateUser({ errorHandling: { hideValidationToast: true } });
   ```

   Non-422 errors still toast centrally (`error-handling.md`). `hideValidationToast` is narrower than `hideToast` on purpose: a 500 during a form submit must still be visible.

2. `useValidationErrors(error)` derives field-keyed messages from the mutation's error ref — a `computed` producing `Record<string, string[]>`.

3. `useExternalErrors(source)` mirrors those into a ref Regle can own as its `externalErrors` modifier. It **copies rather than shares**, because Regle clears an entry as the user edits that field and must not be writing into the mutation's derived state.

4. Regle renders them alongside its own messages, and clears a field's server error as soon as the user edits it.

**Two component shapes, same pieces:**

- **A page that owns its own mutation** chains both directly: `useExternalErrors(useValidationErrors(error))`.
- **A parent that owns the mutation and a child that owns the form** — the common case for dialogs — has the parent derive `useValidationErrors(mutationError)` and pass it down as a `serverErrors` prop; the child does `useExternalErrors(() => props.serverErrors)`.

The second shape is why `useExternalErrors` takes a watch source rather than a plain value: the child has to react to a prop that changes after every failed submit.

## Field error display

Where the `frontend/ui` choice provides inputs with an error-message prop, pass Regle's `$errors` array straight to it — it is already `string[]`.

Where it does not, the project owns a small presenter component. Give it a **fixed minimum height** so a message appearing or disappearing does not shift the layout under the user's cursor mid-form.
