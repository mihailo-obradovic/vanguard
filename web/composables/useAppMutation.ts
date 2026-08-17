import { useMutation } from '@pinia/colada';

import type { UseMutationOptions } from '@pinia/colada';
import type { ErrorHandlingOptions } from '@/utils/handleApiError';

export type AppMutationOptions<TData, TVars> = UseMutationOptions<
  TData,
  TVars
> & {
  errorHandling?: ErrorHandlingOptions;
};

// * What a *caller* of a mutation composable may pass — the options passthrough (`catalyst/stacks/frontend/nuxt/data-layer.md`). `mutation` and `key` are the composable's own to declare, never the caller's to replace.
export type MutationOptions<TData, TVars = void> = Omit<
  AppMutationOptions<TData, TVars>,
  'key' | 'mutation'
>;

export function useAppMutation<TData, TVars = void>(
  options: AppMutationOptions<TData, TVars>
) {
  const { errorHandling, ...mutationOptions } = options;

  const mutation = useMutation(mutationOptions);

  // ! Outside a component instance the watcher would leak, so error handling is skipped — such callers handle errors themselves.
  if (getCurrentInstance()) {
    setupQueryErrorHandling(mutation.error, errorHandling);
  }

  return mutation;
}
