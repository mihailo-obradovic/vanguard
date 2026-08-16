import type { AppMutationOptions } from '@/composables/useAppMutation';

// * The shape every mutation composable in `services/queries/` has: it takes the app mutation options minus the two it fills in itself.
type MutationComposable<TData, TVars> = (
  options: Omit<AppMutationOptions<TData, TVars>, 'key' | 'mutation'>
) => ReturnType<typeof useAppMutation<TData, TVars>>;

// * A dialog whose confirm runs one mutation: it owns the open flag, closes itself once that mutation succeeds, and routes the mutation's 422s to the form inside rather than to a toast — the three things every such dialog would otherwise restate at its own call site (`catalyst/features/006_form-validation-ux.md`).
// * `onSuccess` is whatever else the owner wants on success, e.g. a toast; the close has already happened by then.
export function useMutationDialog<TData, TVars>(
  useDialogMutation: MutationComposable<TData, TVars>,
  onSuccess?: (data: TData) => void
) {
  const dialog = ref(false);

  const {
    mutate: submit,
    isLoading: loading,
    error
  } = useDialogMutation({
    // * A validation failure the dialog's own form could have caught belongs on its field, not in a toast.
    errorHandling: { hideValidationToast: true },
    onSuccess: (data) => {
      dialog.value = false;

      onSuccess?.(data);
    }
  });

  return { dialog, submit, loading, errors: useValidationErrors(error) };
}
