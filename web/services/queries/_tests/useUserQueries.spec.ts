// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { PiniaColada } from '@pinia/colada';
import { defineComponent, ref } from 'vue';

import {
  fetchUsers,
  fetchUser,
  createUser,
  updateUser,
  deleteUser
} from '@/services/user.api';

import {
  usersQueryKeys,
  useFetchUsers,
  useFetchUser,
  useCreateUser,
  useUpdateUser,
  useDeleteUser
} from '../useUserQueries';

// * The services are explicitly imported here, so they mock as a module. This is the boundary
// * the doctrine names: what the composable does around the call, never the call itself.
vi.mock('@/services/user.api', () => ({
  fetchUsers: vi.fn<() => Promise<unknown>>(),
  fetchUser: vi.fn<() => Promise<unknown>>(),
  createUser: vi.fn<() => Promise<unknown>>(),
  updateUser: vi.fn<() => Promise<unknown>>(),
  deleteUser: vi.fn<() => Promise<unknown>>()
}));

const { invalidateQueries } = vi.hoisted(() => ({
  invalidateQueries: vi.fn<(...args: unknown[]) => Promise<void>>()
}));

mockNuxtImport('setupQueryErrorHandling', () => () => {});

const user = {
  id: 7,
  name: 'Mihailo',
  email: 'mihailo@example.com',
  role: 'admin' as const,
  email_verified_at: null,
  created_at: '2026-08-01T00:00:00.000000Z',
  updated_at: '2026-08-01T00:00:00.000000Z'
};

function withQueryCache<T>(use: () => T) {
  const wrapper = mount(
    defineComponent({
      setup() {
        const queryCache = useQueryCache();

        // * Spying on the real cache rather than stubbing it: invalidation is the behaviour
        // * under test, and Colada stays real per the testing doctrine.
        vi.spyOn(queryCache, 'invalidateQueries').mockImplementation(
          invalidateQueries
        );

        return { result: use() };
      },
      template: '<div />'
    }),
    { global: { plugins: [createPinia(), PiniaColada] } }
  );

  return wrapper.vm.result;
}

function invalidatedKeys() {
  return invalidateQueries.mock.calls.map(
    ([options]) => (options as { key: unknown }).key
  );
}

describe('useUserQueries', () => {
  beforeEach(() => {
    // * Implementations are re-stated below; this only drops the call history, which would
    // * otherwise leak between cases.
    vi.clearAllMocks();
    setActivePinia(createPinia());
    invalidateQueries.mockResolvedValue(undefined);
    vi.mocked(fetchUsers).mockResolvedValue({ data: [user], total: 1 });
    vi.mocked(fetchUser).mockResolvedValue(user);
    vi.mocked(createUser).mockResolvedValue(user);
    vi.mocked(updateUser).mockResolvedValue(user);
    vi.mocked(deleteUser).mockResolvedValue(undefined);
  });

  describe('the query keys', () => {
    it('namespaces every user key under the resource', () => {
      expect(usersQueryKeys).toEqual({
        fetchUsers: ['users', 'fetch'],
        fetchUser: ['users', 'get']
      });
    });
  });

  describe('useFetchUsers', () => {
    it('reads the collection through the service', async () => {
      const query = withQueryCache(() => useFetchUsers());

      await flushPromises();

      expect(fetchUsers).toHaveBeenCalledOnce();
      expect(query.data.value).toEqual({ data: [user], total: 1 });
    });
  });

  describe('useFetchUser', () => {
    it('reads the user the id points at', async () => {
      const id = ref(7);

      withQueryCache(() => useFetchUser(id));

      await flushPromises();

      expect(fetchUser).toHaveBeenCalledWith(7);
    });

    it('refetches when the id changes', async () => {
      const id = ref(7);

      withQueryCache(() => useFetchUser(id));
      await flushPromises();

      id.value = 8;
      await flushPromises();

      // * The key is a getter for exactly this reason — a static key would serve id 7 forever.
      expect(fetchUser).toHaveBeenLastCalledWith(8);
    });
  });

  describe('useCreateUser', () => {
    it('creates through the service and refreshes the list', async () => {
      const mutation = withQueryCache(() => useCreateUser());

      await mutation.mutateAsync({
        name: 'Mihailo',
        email: 'mihailo@example.com',
        password: 'correct-horse',
        password_confirmation: 'correct-horse'
      });

      expect(createUser).toHaveBeenCalledOnce();
      expect(invalidatedKeys()).toEqual([usersQueryKeys.fetchUsers]);
    });

    it('runs the caller onSettled after the invalidation', async () => {
      const order: string[] = [];

      invalidateQueries.mockImplementation(async () => {
        order.push('invalidate');
      });

      const mutation = withQueryCache(() =>
        useCreateUser({
          onSettled: () => {
            order.push('caller');
          }
        })
      );

      await mutation.mutateAsync({
        name: 'Mihailo',
        email: 'mihailo@example.com',
        password: 'correct-horse',
        password_confirmation: 'correct-horse'
      });

      expect(order).toEqual(['invalidate', 'caller']);
    });

    it('invalidates even when the create fails', async () => {
      vi.mocked(createUser).mockRejectedValue(new Error('Request failed'));

      const mutation = withQueryCache(() => useCreateUser());

      await expect(
        mutation.mutateAsync({
          name: 'Mihailo',
          email: 'mihailo@example.com',
          password: 'correct-horse',
          password_confirmation: 'correct-horse'
        })
      ).rejects.toBeInstanceOf(Error);

      // * onSettled, not onSuccess: a rejected write may still have reached the server.
      expect(invalidatedKeys()).toEqual([usersQueryKeys.fetchUsers]);
    });
  });

  describe('useUpdateUser', () => {
    it('updates through the service and refreshes the list and that user', async () => {
      const mutation = withQueryCache(() => useUpdateUser());

      await mutation.mutateAsync({ id: 7, userData: { name: 'Renamed' } });

      expect(updateUser).toHaveBeenCalledWith(7, { name: 'Renamed' });
      expect(invalidatedKeys()).toEqual([
        usersQueryKeys.fetchUsers,
        [...usersQueryKeys.fetchUser, 7]
      ]);
    });

    it('invalidates even when the update fails', async () => {
      vi.mocked(updateUser).mockRejectedValue(new Error('Request failed'));

      const mutation = withQueryCache(() => useUpdateUser());

      await expect(
        mutation.mutateAsync({ id: 7, userData: { name: 'Renamed' } })
      ).rejects.toBeInstanceOf(Error);

      // * onSettled, not onSuccess: a failed write may still have changed the server.
      expect(invalidatedKeys()).toHaveLength(2);
    });
  });

  describe('useDeleteUser', () => {
    it('deletes through the service and refreshes the list and that user', async () => {
      const mutation = withQueryCache(() => useDeleteUser());

      await mutation.mutateAsync(7);

      expect(deleteUser).toHaveBeenCalledWith(7);
      expect(invalidatedKeys()).toEqual([
        usersQueryKeys.fetchUsers,
        [...usersQueryKeys.fetchUser, 7]
      ]);
    });
  });
});
