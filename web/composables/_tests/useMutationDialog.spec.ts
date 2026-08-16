// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest';
import { ref } from 'vue';

import { useMutationDialog } from '../useMutationDialog';

import type { FetchError } from 'ofetch';

type CapturedOptions = {
  errorHandling?: { hideValidationToast?: boolean };
  onSuccess?: (data: { status: string }) => void;
};

// * Stands in for a `services/queries/` mutation composable: records the options it was handed and hands back the refs the dialog reads, so a test can drive success and failure without the network.
function fakeMutationComposable() {
  const error = ref<FetchError | null>(null);
  const isLoading = ref(false);

  let captured: CapturedOptions = {};

  function composable(options: CapturedOptions) {
    captured = options;

    return { mutate: vi.fn<() => void>(), isLoading, error };
  }

  return {
    composable: composable as never,
    error,
    isLoading,
    succeed: (data = { status: 'ok' }) => captured.onSuccess?.(data),
    options: () => captured
  };
}

describe('useMutationDialog', () => {
  it('starts closed', () => {
    const mutation = fakeMutationComposable();

    expect(useMutationDialog(mutation.composable).dialog.value).toBe(false);
  });

  // ! The dialog's own form can catch these, so a 422 belongs on the field rather than in a toast. Opting out here is what stops every owner having to remember it.
  it('opts the mutation out of the validation toast', () => {
    const mutation = fakeMutationComposable();

    useMutationDialog(mutation.composable);

    expect(mutation.options().errorHandling).toEqual({
      hideValidationToast: true
    });
  });

  it('closes itself once the mutation succeeds', () => {
    const mutation = fakeMutationComposable();

    const { dialog } = useMutationDialog(mutation.composable);

    dialog.value = true;
    mutation.succeed();

    expect(dialog.value).toBe(false);
  });

  it('runs the owner’s own success handler, with the response', () => {
    const mutation = fakeMutationComposable();
    const onSuccess = vi.fn<(data: { status: string }) => void>();

    useMutationDialog(mutation.composable, onSuccess);
    mutation.succeed({ status: 'Reset link sent.' });

    expect(onSuccess).toHaveBeenCalledWith({ status: 'Reset link sent.' });
  });

  // ! Order matters for a handler that navigates or toasts: the dialog is already gone by then.
  it('closes before handing over to the owner', () => {
    const mutation = fakeMutationComposable();
    const openWhenCalled: boolean[] = [];

    const { dialog } = useMutationDialog(mutation.composable, () => {
      openWhenCalled.push(dialog.value);
    });

    dialog.value = true;
    mutation.succeed();

    expect(openWhenCalled).toEqual([false]);
  });

  it('surfaces the mutation’s in-flight flag', () => {
    const mutation = fakeMutationComposable();

    const { loading } = useMutationDialog(mutation.composable);

    mutation.isLoading.value = true;

    expect(loading.value).toBe(true);
  });

  it('turns a 422 into field errors the dialog can bind', () => {
    const mutation = fakeMutationComposable();

    const { errors } = useMutationDialog(mutation.composable);

    mutation.error.value = {
      statusCode: 422,
      data: { errors: { email: ['That email is taken.'] } }
    } as FetchError;

    expect(errors.value).toEqual({ email: ['That email is taken.'] });
  });
});
