import type { ComputedRef, Ref } from 'vue';
import type { AppMutationOptions } from '@/composables/useAppMutation';

// * The shape every mutation composable in `services/queries/` has: it takes the app mutation options minus the two it fills in itself.
type MutationComposable<TData, TVars> = (
  options: Omit<AppMutationOptions<TData, TVars>, 'key' | 'mutation'>
) => ReturnType<typeof useAppMutation<TData, TVars>>;

// * A dialog that offers more than one mutation names them: `{ create: useCreateUser, update: useUpdateUser }`. `TVars` is loose here on purpose — the constraint only has to admit every entry; each one's own variables type is recovered below, off the object the caller actually passed.
type MutationMap<TData> = Record<string, MutationComposable<TData, any>>;

type Mode<TMap> = keyof TMap & string;

// * One submit handle per mode, each carrying its own mutation's variables type, so `submit.update(...)` cannot be handed a create payload.
type SubmitMap<TMap> = {
  [K in keyof TMap]: TMap[K] extends (...args: never[]) => infer TMutation
    ? TMutation extends { mutate: infer TSubmit }
      ? TSubmit
      : never
    : never;
};

type ValidationErrors = ReturnType<typeof useValidationErrors>;

// * The dialog session every form dialog has: the open flag, and the subject the dialog is about.
// * `subject` outlives `dialog` on purpose — Vuetify fades the dialog out, and a title bound to the subject would blank mid-fade if the subject were cleared on close. `afterLeave` is what clears it, bound to the dialog's `@after-leave`.
type DialogSession<TData> = {
  dialog: Ref<boolean>;
  subject: Ref<TData | null>;
  loading: ComputedRef<boolean>;
  errors: ValidationErrors;
  afterLeave: () => void;
};

// * A dialog whose confirm runs one mutation: it owns the open flag, closes itself once that mutation succeeds, and routes the mutation's 422s to the form inside rather than to a toast — the three things every such dialog would otherwise restate at its own call site (`catalyst/features/010_server-validation-errors.md`).
// * `onSuccess` is whatever else the owner wants on success, e.g. a toast; the close has already happened by then.
export function useMutationDialog<TData, TVars>(
  useDialogMutation: MutationComposable<TData, TVars>,
  onSuccess?: (data: TData) => void
): DialogSession<TData> & {
  open: (subject?: TData) => void;
  submit: ReturnType<typeof useAppMutation<TData, TVars>>['mutate'];
};

// * The same dialog, offering a mutation per mode — an entity form that both creates and updates is one dialog, not two. The mode picked at `open` decides which mutation `submit` runs, which `error` `errors` reads, and what `onSuccess` is told.
export function useMutationDialog<TData, TMap extends MutationMap<TData>>(
  mutations: TMap,
  options?: { onSuccess?: (data: TData, mode: Mode<TMap>) => void }
): DialogSession<TData> & {
  mode: Ref<Mode<TMap>>;
  open: (mode: Mode<TMap>, subject?: TData) => void;
  submit: SubmitMap<TMap>;
};

// ! Implementation signature, not a callable one — the two overloads above are the interface. It is loose in the generics only so both of them narrow to it; every caller-facing type is settled there.
export function useMutationDialog(
  input: MutationComposable<any, any> | MutationMap<any>,
  second?:
    | ((data: any) => void)
    | { onSuccess?: (data: any, mode: never) => void }
) {
  // * One mutation is the one-mode case of many, so the body only ever deals with the map.
  const single = typeof input === 'function';

  const mutations: MutationMap<any> = single ? { default: input } : input;

  // * Both overloads' handlers, read through the one shape the body calls them by; which arguments they actually get is decided per branch below.
  const onSuccess = (
    typeof second === 'function' ? second : second?.onSuccess
  ) as ((data: unknown, mode?: string) => void) | undefined;

  const dialog = ref(false);

  const subject = ref(null) as Ref<unknown>;

  const modes = Object.keys(mutations);

  // * Before the first `open` there is nothing to route to, so the first mode stands in — it decides only which `error` an unopened dialog reads, and an unopened dialog has none.
  const mode = ref(modes[0] as string);

  const instances = Object.fromEntries(
    Object.entries(mutations).map(([key, useDialogMutation]) => [
      key,
      useDialogMutation({
        // * A validation failure the dialog's own form could have caught belongs on its field, not in a toast.
        errorHandling: { hideValidationToast: true },
        onSuccess: (data: unknown) => {
          dialog.value = false;

          // ! `default` is this composable's own stand-in for "the only mode" — a single-mutation owner never asked for a mode and must not be handed one.
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

  // * Only the mode the dialog was opened in can have failed, so its errors are the only ones the form should show.
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

  function afterLeave() {
    subject.value = null;
  }

  // ! Cast because the two overloads disagree here by design — one submit handle or a map of them. Which one a caller gets is settled by the overload it matched, not here.
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

  // ! Same reason as `submit`: the subject's type and the set of modes are known to the overload the caller matched, never to the body.
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
