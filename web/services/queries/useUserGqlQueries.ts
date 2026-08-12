import { useQueryCache } from '@pinia/colada';

import { fetchUsersGql, updateUserGql } from '@/services/user.gql';

import type { AppQueryOptions } from '@/composables/useAppQuery';
import type { AppMutationOptions } from '@/composables/useAppMutation';
import type { User } from '@/types/auth';
import type { UpdateUserGqlInput } from '@/types/user';

// * A namespace of its own: the GraphQL and REST user queries hold the same data but are
// * separate cache entries, and invalidating one must not silently claim to refresh the other.
export const usersGqlQueryKeys = {
  fetchUsers: ['users-gql', 'fetch']
} as const;

export function useFetchUsersGql(
  options: Omit<AppQueryOptions<User[]>, 'key' | 'query'> = {}
) {
  return useAppQuery<User[]>({
    key: usersGqlQueryKeys.fetchUsers,
    query: () => fetchUsersGql(),
    ...options
  });
}

export function useUpdateUserGql(
  options: Omit<
    AppMutationOptions<User, UpdateUserGqlInput>,
    'key' | 'mutation'
  > = {}
) {
  const queryCache = useQueryCache();

  return useAppMutation({
    mutation: (input: UpdateUserGqlInput) => updateUserGql(input),
    ...options,
    onSettled: async (data, error, vars, context) => {
      await queryCache.invalidateQueries({ key: usersGqlQueryKeys.fetchUsers });

      await options.onSettled?.(data, error, vars, context);
    }
  });
}
