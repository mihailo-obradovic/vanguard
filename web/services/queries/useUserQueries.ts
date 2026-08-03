import { useQueryCache } from '@pinia/colada';

import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser
} from '@/services/user.api';

import type { AppQueryOptions } from '@/composables/useAppQuery';
import type { AppMutationOptions } from '@/composables/useAppMutation';
import type { User } from '@/types/auth';
import type {
  UsersResponse,
  CreateUserForm,
  UpdateUserForm
} from '@/types/user';

export const usersQueryKeys = {
  fetchUsers: ['users', 'fetch'],
  fetchUser: ['users', 'get'],
  createUser: ['users', 'create'],
  updateUser: ['users', 'update'],
  deleteUser: ['users', 'delete']
} as const;

export function useFetchUsers(
  options: Omit<AppQueryOptions<UsersResponse>, 'key' | 'query'> = {}
) {
  return useAppQuery<UsersResponse>({
    key: usersQueryKeys.fetchUsers,
    query: () => fetchUsers(),
    ...options
  });
}

export function useCreateUser(
  options: Omit<
    AppMutationOptions<User, CreateUserForm>,
    'key' | 'mutation'
  > = {}
) {
  const queryCache = useQueryCache();

  return useAppMutation({
    key: usersQueryKeys.createUser,
    mutation: (userData: CreateUserForm) => createUser(userData),
    ...options,
    onSettled: async (data, error, vars, context) => {
      await queryCache.invalidateQueries({ key: usersQueryKeys.fetchUsers });

      await options.onSettled?.(data, error, vars, context);
    }
  });
}

export function useUpdateUser(
  options: Omit<
    AppMutationOptions<User, { id: number; userData: UpdateUserForm }>,
    'key' | 'mutation'
  > = {}
) {
  const queryCache = useQueryCache();

  return useAppMutation({
    key: usersQueryKeys.updateUser,
    mutation: ({ id, userData }: { id: number; userData: UpdateUserForm }) =>
      updateUser(id, userData),
    ...options,
    onSettled: async (data, error, vars, context) => {
      await queryCache.invalidateQueries({ key: usersQueryKeys.fetchUsers });
      await queryCache.invalidateQueries({
        key: [...usersQueryKeys.fetchUser, vars.id]
      });

      await options.onSettled?.(data, error, vars, context);
    }
  });
}

export function useDeleteUser(
  options: Omit<AppMutationOptions<void, number>, 'key' | 'mutation'> = {}
) {
  const queryCache = useQueryCache();

  return useAppMutation({
    key: usersQueryKeys.deleteUser,
    mutation: (id: number) => deleteUser(id),
    ...options,
    onSettled: async (data, error, id, context) => {
      await queryCache.invalidateQueries({ key: usersQueryKeys.fetchUsers });
      await queryCache.invalidateQueries({
        key: [...usersQueryKeys.fetchUser, id]
      });

      await options.onSettled?.(data, error, id, context);
    }
  });
}
