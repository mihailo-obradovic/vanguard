import { useQuery } from '@pinia/colada';

import type { UseQueryOptions } from '@pinia/colada';
import type { ErrorHandlingOptions } from '@/utils/handleApiError';

export type AppQueryOptions<T> = UseQueryOptions<T> & {
  errorHandling?: ErrorHandlingOptions;
};

export function useAppQuery<T>(options: AppQueryOptions<T>) {
  const { errorHandling, ...queryOptions } = options;

  const query = useQuery({
    // * Prevent UI flickering when switching pages or filters
    placeholderData: (prev: T | undefined) => prev,
    ...queryOptions
  });

  if (getCurrentInstance()) {
    setupQueryErrorHandling(query.error, errorHandling);
  }

  return query;
}
