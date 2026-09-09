import type { Ref } from 'vue';

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
  initialState?: () => TForm;
  onReset?: () => void;
  onSubmit: (form: TForm) => void;
};

// * Wires a dialog's cancel/confirm actions to Regle's `r$` and decides reset timing: a form
// * whose fresh state is constant resets on close (after the fade completes, `handleAfterLeave`);
// * a form whose fresh state depends on props read at open time resets when the dialog opens.
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

  function handleAfterLeave() {
    if (options.initialState) {
      return;
    }
    reset();
  }

  return { handleCancel, handleConfirm, handleAfterLeave };
}
