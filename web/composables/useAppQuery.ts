import { useQuery } from '@pinia/colada';

import type { UseQueryOptions } from '@pinia/colada';
import type { ErrorHandlingOptions } from '@/utils/handleApiError';

export type AppQueryOptions<T> = UseQueryOptions<T> & {
  errorHandling?: ErrorHandlingOptions;
};

// * What a *caller* of a query composable may pass — the options passthrough (`catalyst/stacks/frontend/nuxt/data-layer.md`). `query` and `key` are the composable's own to declare, never the caller's to replace.
export type QueryOptions<T> = Omit<AppQueryOptions<T>, 'key' | 'query'>;

export function useAppQuery<T>(options: AppQueryOptions<T>) {
  const { errorHandling, ...queryOptions } = options;

  const query = useQuery({
    // * Prevent UI flickering when switching pages or filters
    placeholderData: (prev: T | undefined) => prev,
    ...queryOptions
  });

  // ! Outside a component instance the watcher would leak, so error handling is skipped — such callers handle errors themselves.
  if (getCurrentInstance()) {
    setupQueryErrorHandling(query.error, errorHandling);
  }

  return query;
}
