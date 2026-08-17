import { useQueryCache } from '@pinia/colada';

import { fetchUsersGql, updateUserGql } from '@/services/user.gql';

import type { QueryOptions } from '@/composables/useAppQuery';
import type { MutationOptions } from '@/composables/useAppMutation';
import type { User } from '@/types/auth';
import type { UpdateUserGqlInput } from '@/types/user';

// * A namespace of its own: the GraphQL and REST user queries hold the same data but are
// * separate cache entries, and invalidating one must not silently claim to refresh the other.
export const usersGqlQueryKeys = {
  fetchUsers: ['users-gql', 'fetch']
} as const;

export function useFetchUsersGql(options: QueryOptions<User[]> = {}) {
  return useAppQuery<User[]>({
    key: usersGqlQueryKeys.fetchUsers,
    query: () => fetchUsersGql(),
    ...options
  });
}

export function useUpdateUserGql(
  options: MutationOptions<User, UpdateUserGqlInput> = {}
) {
  const queryCache = useQueryCache();

  return useAppMutation({
    mutation: (input: UpdateUserGqlInput) => updateUserGql(input),
    ...options,
    onSettled: chainAfter(
      () => queryCache.invalidateQueries({ key: usersGqlQueryKeys.fetchUsers }),
      options.onSettled
    )
  });
}
