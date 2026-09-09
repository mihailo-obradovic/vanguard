import type { ComputedRef, Ref } from 'vue';
import type { AppMutationOptions } from '@/composables/useAppMutation';

type MutationComposable<TData, TVars> = (
  options: Omit<AppMutationOptions<TData, TVars>, 'key' | 'mutation'>
) => ReturnType<typeof useAppMutation<TData, TVars>>;

type MutationMap = Record<string, MutationComposable<any, any>>;

type DataOf<TMap> =
  TMap extends Record<string, MutationComposable<infer TData, any>>
    ? TData
    : never;

type Mode<TMap> = keyof TMap & string;

type SubmitMap<TMap> = {
  [K in keyof TMap]: TMap[K] extends (...args: never[]) => infer TMutation
    ? TMutation extends { mutate: infer TSubmit }
      ? TSubmit
      : never
    : never;
};

type ValidationErrors = ReturnType<typeof useValidationErrors>;

type DialogSession<TData> = {
  dialog: Ref<boolean>;
  subject: Ref<TData | null>;
  loading: ComputedRef<boolean>;
  errors: ValidationErrors;
  afterLeave: () => void;
};

// * Owns a dialog's open/close state and the mutation(s) behind it. One overload wraps a single
// * mutation composable; the other wraps a map keyed by mode (e.g. create/update) sharing one
// * dialog, routing errors and loading to whichever mode is active.
export function useMutationDialog<TData, TVars>(
  useDialogMutation: MutationComposable<TData, TVars>,
  onSuccess?: (data: TData) => void
): DialogSession<TData> & {
  open: (subject?: TData) => void;
  submit: ReturnType<typeof useAppMutation<TData, TVars>>['mutate'];
};

export function useMutationDialog<TMap extends MutationMap>(
  mutations: TMap,
  options?: { onSuccess?: (data: DataOf<TMap>, mode: Mode<TMap>) => void }
): DialogSession<DataOf<TMap>> & {
  mode: Ref<Mode<TMap>>;
  open: (mode: Mode<TMap>, subject?: DataOf<TMap>) => void;
  submit: SubmitMap<TMap>;
};

export function useMutationDialog(
  input: MutationComposable<any, any> | MutationMap,
  second?:
    | ((data: any) => void)
    | { onSuccess?: (data: any, mode: never) => void }
) {
  const single = typeof input === 'function';
  const mutations: MutationMap = single ? { default: input } : input;

  const onSuccess = (
    typeof second === 'function' ? second : second?.onSuccess
  ) as ((data: unknown, mode?: string) => void) | undefined;

  const dialog = ref(false);
  const subject = ref(null) as Ref<unknown>;
  const modes = Object.keys(mutations);
  const mode = ref(modes[0] as string);

  const instances = Object.fromEntries(
    Object.entries(mutations).map(([key, useDialogMutation]) => [
      key,
      useDialogMutation({
        errorHandling: { suppressToasts: 'validation' },
        onSuccess: (data: unknown) => {
          dialog.value = false;
          if (single) {
            onSuccess?.(data);
          } else {
            onSuccess?.(data, key);
          }
        }
      })
    ])
  );

  const loading = computed(() =>
    Object.values(instances).some((instance) => instance.isLoading.value)
  );

  const errors = useValidationErrors(
    computed(() => instances[mode.value]?.error.value)
  );

  function open(modeOrSubject?: unknown, maybeSubject?: unknown) {
    if (!single) {
      mode.value = modeOrSubject as string;
    }
    subject.value = (single ? modeOrSubject : maybeSubject) ?? null;
    dialog.value = true;
  }

  // ! The dialog is closed but still fading; a title bound to the subject would blank mid-fade
  // ! if this cleared on close instead of on the leave transition's end (`after-leave`).
  function afterLeave() {
    subject.value = null;
  }

  const submit = (
    single
      ? instances.default!.mutate
      : Object.fromEntries(
          Object.entries(instances).map(([key, instance]) => [
            key,
            instance.mutate
          ])
        )
  ) as never;

  return {
    dialog,
    subject: subject as Ref<never>,
    mode: mode as Ref<never>,
    open,
    submit,
    loading,
    errors,
    afterLeave
  };
}
