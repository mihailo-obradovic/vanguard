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
  const mutate = vi.fn<(vars?: unknown) => void>();

  let captured: CapturedOptions = {};

  function composable(options: CapturedOptions) {
    captured = options;

    return { mutate, isLoading, error };
  }

  return {
    composable: composable as never,
    error,
    isLoading,
    mutate,
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

  it('opens on a subject, and keeps it past the close for the fade-out', () => {
    const mutation = fakeMutationComposable();

    const { dialog, subject, open, afterLeave } = useMutationDialog(
      mutation.composable
    );

    open({ status: 'Ada' } as never);

    expect(dialog.value).toBe(true);
    expect(subject.value).toEqual({ status: 'Ada' });

    mutation.succeed();

    // ! The dialog is closed but still fading; a title bound to the subject would blank mid-fade if this cleared here.
    expect(subject.value).toEqual({ status: 'Ada' });

    afterLeave();

    expect(subject.value).toBeNull();
  });
});

describe('useMutationDialog, given a mutation per mode', () => {
  function fakePair() {
    const create = fakeMutationComposable();
    const update = fakeMutationComposable();

    return {
      create,
      update,
      dialogFor: (
        onSuccess?: (data: { status: string }, mode: string) => void
      ) =>
        useMutationDialog(
          { create: create.composable, update: update.composable },
          { onSuccess } as never
        )
    };
  }

  it('opens in the mode it was told, on that mode’s subject', () => {
    const { dialogFor } = fakePair();

    const { dialog, mode, subject, open } = dialogFor();

    open('update', { status: 'Ada' } as never);

    expect(dialog.value).toBe(true);
    expect(mode.value).toBe('update');
    expect(subject.value).toEqual({ status: 'Ada' });
  });

  it('opts every mutation in the map out of the validation toast', () => {
    const { create, update, dialogFor } = fakePair();

    dialogFor();

    expect(create.options().errorHandling).toEqual({
      hideValidationToast: true
    });
    expect(update.options().errorHandling).toEqual({
      hideValidationToast: true
    });
  });

  it('runs the mutation belonging to the mode it is asked for', () => {
    const { create, update, dialogFor } = fakePair();

    const { submit } = dialogFor();

    // * The fakes are not real query composables, so the map's per-mode variables types cannot be reconstructed here — the routing is what this case is about.
    (submit.update as unknown as (vars: unknown) => void)({ id: 1 });

    expect(update.mutate).toHaveBeenCalledWith({ id: 1 });
    expect(create.mutate).not.toHaveBeenCalled();
  });

  // ! The whole point of routing by mode: an error from the mode the user has left must not follow them into the one they are in.
  it('shows only the active mode’s errors', () => {
    const { create, dialogFor } = fakePair();

    const { errors, open } = dialogFor();

    open('create');

    create.error.value = {
      statusCode: 422,
      data: { errors: { email: ['That email is taken.'] } }
    } as FetchError;

    expect(errors.value).toEqual({ email: ['That email is taken.'] });

    open('update', { status: 'Ada' } as never);

    expect(errors.value).toEqual({});
  });

  it('is loading while either mutation is in flight', () => {
    const { create, update, dialogFor } = fakePair();

    const { loading } = dialogFor();

    expect(loading.value).toBe(false);

    update.isLoading.value = true;

    expect(loading.value).toBe(true);

    update.isLoading.value = false;
    create.isLoading.value = true;

    expect(loading.value).toBe(true);
  });

  it('closes on either mutation, and tells the owner which one succeeded', () => {
    const { update, dialogFor } = fakePair();

    const onSuccess = vi.fn<(data: { status: string }, mode: string) => void>();

    const { dialog, open } = dialogFor(onSuccess);

    open('update', { status: 'Ada' } as never);
    update.succeed({ status: 'Saved.' });

    expect(dialog.value).toBe(false);
    expect(onSuccess).toHaveBeenCalledWith({ status: 'Saved.' }, 'update');
  });
});
