// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { PiniaColada } from '@pinia/colada';
import { defineComponent } from 'vue';

import { fetchUsersGql, updateUserGql } from '@/services/user.gql';

import { usersQueryKeys } from '../useUserQueries';
import {
  usersGqlQueryKeys,
  useFetchUsersGql,
  useUpdateUserGql
} from '../useUserGqlQueries';

vi.mock('@/services/user.gql', () => ({
  fetchUsersGql: vi.fn<() => Promise<unknown>>(),
  updateUserGql: vi.fn<() => Promise<unknown>>()
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

describe('useUserGqlQueries', () => {
  beforeEach(() => {
    // * Implementations are re-stated below; this only drops the call history, which would
    // * otherwise leak between cases.
    vi.clearAllMocks();
    setActivePinia(createPinia());
    invalidateQueries.mockResolvedValue(undefined);
    vi.mocked(fetchUsersGql).mockResolvedValue([user]);
    vi.mocked(updateUserGql).mockResolvedValue(user);
  });

  describe('the query keys', () => {
    it('keeps the GraphQL users in a namespace of their own', () => {
      expect(usersGqlQueryKeys.fetchUsers).toEqual(['users-gql', 'fetch']);
      // * Same data, separate cache entry: invalidating one must not claim to refresh the
      // * other (features/007_graphql-api.md).
      expect(usersGqlQueryKeys.fetchUsers).not.toEqual(
        usersQueryKeys.fetchUsers
      );
    });
  });

  describe('useFetchUsersGql', () => {
    it('reads the users through the GraphQL service', async () => {
      const query = withQueryCache(() => useFetchUsersGql());

      await flushPromises();

      expect(fetchUsersGql).toHaveBeenCalledOnce();
      expect(query.data.value).toEqual([user]);
    });
  });

  describe('useUpdateUserGql', () => {
    it('updates through the GraphQL service and refreshes its own list', async () => {
      const mutation = withQueryCache(() => useUpdateUserGql());

      await mutation.mutateAsync({ id: 7, name: 'Renamed' });

      expect(updateUserGql).toHaveBeenCalledWith({ id: 7, name: 'Renamed' });
      expect(invalidatedKeys()).toEqual([usersGqlQueryKeys.fetchUsers]);
    });

    it('leaves the REST users cache alone', async () => {
      const mutation = withQueryCache(() => useUpdateUserGql());

      await mutation.mutateAsync({ id: 7, name: 'Renamed' });

      expect(invalidatedKeys()).not.toContainEqual(usersQueryKeys.fetchUsers);
    });

    it('runs the caller onSettled after the invalidation', async () => {
      const order: string[] = [];

      invalidateQueries.mockImplementation(async () => {
        order.push('invalidate');
      });

      const mutation = withQueryCache(() =>
        useUpdateUserGql({
          onSettled: () => {
            order.push('caller');
          }
        })
      );

      await mutation.mutateAsync({ id: 7, name: 'Renamed' });

      expect(order).toEqual(['invalidate', 'caller']);
    });

    it('invalidates even when the update fails', async () => {
      vi.mocked(updateUserGql).mockRejectedValue(new Error('Request failed'));

      const mutation = withQueryCache(() => useUpdateUserGql());

      await expect(
        mutation.mutateAsync({ id: 7, name: 'Renamed' })
      ).rejects.toBeInstanceOf(Error);
      expect(invalidatedKeys()).toEqual([usersGqlQueryKeys.fetchUsers]);
    });
  });
});
