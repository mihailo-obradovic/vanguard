// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest';
import { ref, nextTick } from 'vue';

import { useDialogForm } from '../useDialogForm';

// * Stands in for Regle's `r$`: records the reset it was asked for and answers `$validate` with whatever the test set.
function fakeValidation(valid = true) {
  const resets: Record<string, unknown>[] = [];

  return {
    resets,
    $validate: vi.fn<() => Promise<{ valid: boolean }>>(async () => ({
      valid
    })),
    $reset: vi.fn<(options: Record<string, unknown>) => void>((options) => {
      resets.push(options);
    })
  };
}

describe('useDialogForm', () => {
  it('closes the dialog on cancel', () => {
    const dialog = ref(true);
    const form = ref({ email: 'a@b.c' });

    const { handleCancel } = useDialogForm(dialog, fakeValidation(), {
      form,
      onSubmit: vi.fn<(form: Record<string, unknown>) => void>()
    });

    handleCancel();

    expect(dialog.value).toBe(false);
  });

  it('submits the form once validation passes', async () => {
    const dialog = ref(true);
    const form = ref({ email: 'a@b.c' });
    const onSubmit = vi.fn<(form: Record<string, unknown>) => void>();

    const { handleConfirm } = useDialogForm(dialog, fakeValidation(true), {
      form,
      onSubmit
    });

    await handleConfirm();

    expect(onSubmit).toHaveBeenCalledWith({ email: 'a@b.c' });
  });

  it('stays put when validation fails', async () => {
    const dialog = ref(true);
    const onSubmit = vi.fn<(form: Record<string, unknown>) => void>();

    const { handleConfirm } = useDialogForm(dialog, fakeValidation(false), {
      form: ref({ email: '' }),
      onSubmit
    });

    await handleConfirm();

    expect(onSubmit).not.toHaveBeenCalled();
  });

  // ! The emitted payload must not be the live form ref: the owner holds on to it across the close transition, and the reset that follows would otherwise blank the values it is sending.
  it('submits a copy, not the form ref itself', async () => {
    const form = ref({ email: 'a@b.c' });
    const onSubmit = vi.fn<(form: Record<string, unknown>) => void>();

    const { handleConfirm } = useDialogForm(ref(true), fakeValidation(), {
      form,
      onSubmit
    });

    await handleConfirm();

    expect(onSubmit.mock.calls[0]?.[0]).not.toBe(form.value);
  });

  describe('a form whose fresh state is constant', () => {
    it('resets to its initial state after the close transition', () => {
      const r$ = fakeValidation();

      const { handleAfterLeave } = useDialogForm(ref(false), r$, {
        form: ref({ email: 'a@b.c' }),
        onSubmit: vi.fn<(form: Record<string, unknown>) => void>()
      });

      handleAfterLeave();

      expect(r$.resets).toEqual([
        { toInitialState: true, clearExternalErrors: true }
      ]);
    });

    it('does not reset when the dialog opens', async () => {
      const dialog = ref(false);
      const r$ = fakeValidation();

      useDialogForm(dialog, r$, {
        form: ref({ email: '' }),
        onSubmit: vi.fn<(form: Record<string, unknown>) => void>()
      });

      dialog.value = true;
      await nextTick();

      expect(r$.$reset).not.toHaveBeenCalled();
    });
  });

  describe('a form whose fresh state depends on props', () => {
    it('resets to the state read at the moment it opens', async () => {
      const dialog = ref(false);
      const r$ = fakeValidation();
      const user = ref({ name: 'Ada' });

      useDialogForm(dialog, r$, {
        form: ref({ name: 'stale' }),
        initialState: () => ({ name: user.value.name }),
        onSubmit: vi.fn<(form: Record<string, unknown>) => void>()
      });

      user.value = { name: 'Grace' };
      dialog.value = true;
      await nextTick();

      expect(r$.resets).toEqual([
        { toState: { name: 'Grace' }, clearExternalErrors: true }
      ]);
    });

    it('ignores the after-close hook, which would read the previous session’s props', () => {
      const r$ = fakeValidation();

      const { handleAfterLeave } = useDialogForm(ref(false), r$, {
        form: ref({ name: '' }),
        initialState: () => ({ name: 'Ada' }),
        onSubmit: vi.fn<(form: Record<string, unknown>) => void>()
      });

      handleAfterLeave();

      expect(r$.$reset).not.toHaveBeenCalled();
    });
  });

  it('clears the extra state a form keeps beside the fields', () => {
    const showPassword = ref(true);

    const { handleAfterLeave } = useDialogForm(ref(false), fakeValidation(), {
      form: ref({ password: 'secret' }),
      onReset: () => {
        showPassword.value = false;
      },
      onSubmit: vi.fn<(form: Record<string, unknown>) => void>()
    });

    handleAfterLeave();

    expect(showPassword.value).toBe(false);
  });
});
