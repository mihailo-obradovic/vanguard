import { useQueryCache } from '@pinia/colada';

import {
  fetchUsers,
  fetchUser,
  createUser,
  updateUser,
  deleteUser
} from '@/services/user.api';

import type { QueryOptions } from '@/composables/useAppQuery';
import type { MutationOptions } from '@/composables/useAppMutation';
import type { User } from '@/types/auth';
import type {
  UsersResponse,
  CreateUserForm,
  UpdateUserForm
} from '@/types/user';

export const usersQueryKeys = {
  fetchUsers: ['users', 'fetch'],
  fetchUser: ['users', 'get']
} as const;

export function useFetchUsers(options: QueryOptions<UsersResponse> = {}) {
  return useAppQuery<UsersResponse>({
    key: usersQueryKeys.fetchUsers,
    query: () => fetchUsers(),
    ...options
  });
}

// * Not consumed yet — intended for the upcoming user-detail view.
export function useFetchUser(
  id: Ref<number>,
  options: QueryOptions<User> = {}
) {
  return useAppQuery<User>({
    key: () => [...usersQueryKeys.fetchUser, id.value],
    query: () => fetchUser(id.value),
    ...options
  });
}

export function useCreateUser(
  options: MutationOptions<User, CreateUserForm> = {}
) {
  const queryCache = useQueryCache();

  return useAppMutation({
    mutation: (userData: CreateUserForm) => createUser(userData),
    ...options,
    onSettled: chainAfter(
      () => queryCache.invalidateQueries({ key: usersQueryKeys.fetchUsers }),
      options.onSettled
    )
  });
}

export function useUpdateUser(
  options: MutationOptions<User, { id: number; userData: UpdateUserForm }> = {}
) {
  const queryCache = useQueryCache();

  return useAppMutation({
    mutation: ({ id, userData }: { id: number; userData: UpdateUserForm }) =>
      updateUser(id, userData),
    ...options,
    onSettled: chainAfter(async (_data, _error, vars) => {
      await queryCache.invalidateQueries({ key: usersQueryKeys.fetchUsers });
      await queryCache.invalidateQueries({
        key: [...usersQueryKeys.fetchUser, vars.id]
      });
    }, options.onSettled)
  });
}

export function useDeleteUser(options: MutationOptions<void, number> = {}) {
  const queryCache = useQueryCache();

  return useAppMutation({
    mutation: (id: number) => deleteUser(id),
    ...options,
    onSettled: chainAfter(async (_data, _error, id) => {
      await queryCache.invalidateQueries({ key: usersQueryKeys.fetchUsers });
      await queryCache.invalidateQueries({
        key: [...usersQueryKeys.fetchUser, id]
      });
    }, options.onSettled)
  });
}
