import { useMutation } from '@pinia/colada';

import type { UseMutationOptions } from '@pinia/colada';
import type { ErrorHandlingOptions } from '@/utils/handleApiError';

export type AppMutationOptions<TData, TVars> = UseMutationOptions<
  TData,
  TVars
> & {
  errorHandling?: ErrorHandlingOptions;
};

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
