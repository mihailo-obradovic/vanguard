import type { Ref } from 'vue';

// ! The slice of Regle's `r$` this composable drives, typed structurally rather than as Regle's own type. Naming that type means naming the generics of the configured `useRegle` — and taking the rules object as a parameter instead, so `r$` is built in here, leaves Regle's `TState extends MaybeInput<PrimitiveTypes> ? … : …` parameter an unresolved conditional. Working around that widens the state until inference stalls the compiler outright (a `pnpm typecheck` that no longer terminates). Hence: the caller keeps `useRegle`, this composable takes the result.
type DialogFormValidation = {
  $validate: () => Promise<{ valid: boolean }>;
  $reset: (options: {
    toInitialState?: boolean;
    toState?: Record<string, any>;
    clearExternalErrors?: boolean;
  }) => void;
};

type DialogFormOptions<TForm extends Record<string, any>> = {
  form: Ref<TForm>;
  // * Supplying this switches the reset to on-open with `toState`; omitting it resets after the close transition with `toInitialState`.
  initialState?: () => TForm;
  // * State to clear alongside the form, e.g. a shared password-visibility toggle.
  onReset?: () => void;
  onSubmit: (form: TForm) => void;
};

// * The cancel / validate-then-submit / reset trio every dialog form repeats, so the reset timing is decided once instead of per dialog.
// ! A design review proposed folding the server-422 bridge in here too, so a dialog would stop wiring `useExternalErrors` beside this. Rejected: the constraint above is what forbids it. `externalErrors` has to reach `useRegle`, and `useRegle` is built by the caller precisely because naming its generics stalls the compiler — so this composable can only hand the ref back for the caller to pass in, a two-call handshake that saves one import and no decisions. The bridge is also named as its own step by `catalyst/features/010_server-validation-errors.md`. Revisit only if a form ever needs the reset and the bridge to agree about something; today they merely sit next to each other.
// * That timing is the decision this composable exists to hold (`catalyst/stacks/frontend/nuxt/validation.md`): a form whose fresh state is constant resets from the after-close hook, so no value — passwords included — lingers while the dialog is shut. A form whose fresh state depends on props the parent assigns right before opening cannot use that hook, because at close time those props still describe the previous session; it resets on open instead. Passing `initialState` is what declares which kind a form is.
export function useDialogForm<TForm extends Record<string, any>>(
  dialog: Ref<boolean>,
  r$: DialogFormValidation,
  options: DialogFormOptions<TForm>
) {
  function reset() {
    options.onReset?.();

    if (options.initialState) {
      r$.$reset({ toState: options.initialState(), clearExternalErrors: true });

      return;
    }

    r$.$reset({ toInitialState: true, clearExternalErrors: true });
  }

  function handleCancel() {
    dialog.value = false;
  }

  async function handleConfirm() {
    const { valid } = await r$.$validate();

    if (valid) {
      options.onSubmit({ ...options.form.value });
    }
  }

  watch(dialog, (open) => {
    if (!open || !options.initialState) {
      return;
    }

    reset();
  });

  // * Bound to the dialog's `after-leave`; a no-op for the forms that reset on open, so every dialog can bind it unconditionally.
  function handleAfterLeave() {
    if (options.initialState) {
      return;
    }

    reset();
  }

  return { handleCancel, handleConfirm, handleAfterLeave };
}
