// @vitest-environment nuxt
import { describe, it, expect, beforeEach } from 'vitest';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { PiniaColada } from '@pinia/colada';
import { http, HttpResponse } from 'msw';
import { defineComponent, ref } from 'vue';

import { server } from '@/mocks/server';
import { apiUrl } from '@/mocks/api';
import { recordRequests } from '@/mocks/requests';
import { buildUser } from '@/mocks/fixtures';
import { userHandlers } from '@/mocks/handlers/user';

import {
  usersQueryKeys,
  useFetchUsers,
  useFetchUser,
  useCreateUser,
  useUpdateUser,
  useDeleteUser
} from '../useUserQueries';

// * Stubbed because it reaches for the router and the toast plugin, neither of which this spec
// * is about; its own behaviour is covered in setupQueryErrorHandling.spec.ts.
mockNuxtImport('setupQueryErrorHandling', () => () => {});

const requests = recordRequests();

const user = buildUser({ id: 7, role: 'admin' });

const form = {
  name: 'Mihailo',
  email: 'mihailo@example.com',
  password: 'correct-horse',
  password_confirmation: 'correct-horse'
};

function mountQueries<T extends Record<string, unknown>>(use: () => T): T {
  const pinia = createPinia();

  setActivePinia(pinia);

  const wrapper = mount(
    defineComponent({
      setup() {
        return { result: use() };
      },
      template: '<div />'
    }),
    { global: { plugins: [pinia, PiniaColada] } }
  );

  return wrapper.vm.result as T;
}

/** Mount the composables, let the queries settle, then start recording from a clean slate. */
async function mountSettled<T extends Record<string, unknown>>(
  use: () => T
): Promise<T> {
  const result = mountQueries(use);

  await requests.settle();
  requests.reset();

  return result;
}

describe('useUserQueries', () => {
  beforeEach(() => {
    requests.reset();
    server.use(...userHandlers(user));
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
    it('reads the collection', async () => {
      const { list } = mountQueries(() => ({ list: useFetchUsers() }));

      await flushPromises();

      expect(requests.trace()).toEqual(['GET /api/users']);
      expect(list.data.value).toEqual({ data: [user], total: 1 });
    });
  });

  describe('useFetchUser', () => {
    it('reads the user the id points at', async () => {
      const id = ref(7);
      const { one } = mountQueries(() => ({ one: useFetchUser(id) }));

      await flushPromises();

      expect(requests.trace()).toEqual(['GET /api/users/7']);
      expect(one.data.value).toEqual(user);
    });

    it('refetches when the id changes', async () => {
      const id = ref(7);

      await mountSettled(() => ({ one: useFetchUser(id) }));

      id.value = 8;
      await flushPromises();

      // * The key is a getter for exactly this reason — a static key would serve id 7 forever.
      expect(requests.trace()).toEqual(['GET /api/users/8']);
    });
  });

  describe('useCreateUser', () => {
    it('creates the user and refreshes the list', async () => {
      const { create } = await mountSettled(() => ({
        list: useFetchUsers(),
        create: useCreateUser()
      }));

      await create.mutateAsync(form);
      await requests.settle();

      // * The refetch is the point: the list a component is showing must not stay stale.
      expect(requests.trace()).toEqual(['POST /api/users', 'GET /api/users']);
    });

    it('leaves a single-user query alone', async () => {
      // * Pins what the key does not reach: invalidating the whole cache would also refetch
      // * this one, and the list assertion above cannot tell the difference.
      const { create } = await mountSettled(() => ({
        list: useFetchUsers(),
        one: useFetchUser(ref(7)),
        create: useCreateUser()
      }));

      await create.mutateAsync(form);
      await requests.settle();

      expect(requests.trace()).toEqual(['POST /api/users', 'GET /api/users']);
    });

    it('runs the caller onSettled after the list has been refreshed', async () => {
      let traceWhenCallerRan: string[] = [];

      const { create } = await mountSettled(() => ({
        list: useFetchUsers(),
        create: useCreateUser({
          onSettled: () => {
            traceWhenCallerRan = requests.trace();
          }
        })
      }));

      await create.mutateAsync(form);

      expect(traceWhenCallerRan).toEqual(['POST /api/users', 'GET /api/users']);
    });

    it('refreshes the list even when the create fails', async () => {
      server.use(
        http.post(apiUrl('/api/users'), () =>
          HttpResponse.json({ message: 'Request failed' }, { status: 500 })
        )
      );

      const { create } = await mountSettled(() => ({
        list: useFetchUsers(),
        create: useCreateUser()
      }));

      await expect(create.mutateAsync(form)).rejects.toBeInstanceOf(Error);
      await requests.settle();

      // * onSettled, not onSuccess: a rejected write may still have reached the server.
      expect(requests.trace()).toEqual(['POST /api/users', 'GET /api/users']);
    });
  });

  describe('useUpdateUser', () => {
    it('updates the user and refreshes the list and that user', async () => {
      const id = ref(7);

      const { update } = await mountSettled(() => ({
        list: useFetchUsers(),
        one: useFetchUser(id),
        update: useUpdateUser()
      }));

      await update.mutateAsync({ id: 7, userData: { name: 'Renamed' } });
      await requests.settle();

      expect(requests.trace()).toEqual([
        'PUT /api/users/7',
        'GET /api/users',
        'GET /api/users/7'
      ]);
    });

    it('refreshes both even when the update fails', async () => {
      server.use(
        http.put(apiUrl('/api/users/:id'), () =>
          HttpResponse.json({ message: 'Request failed' }, { status: 500 })
        )
      );

      const id = ref(7);

      const { update } = await mountSettled(() => ({
        list: useFetchUsers(),
        one: useFetchUser(id),
        update: useUpdateUser()
      }));

      await expect(
        update.mutateAsync({ id: 7, userData: { name: 'Renamed' } })
      ).rejects.toBeInstanceOf(Error);
      await requests.settle();

      // * onSettled, not onSuccess: a failed write may still have changed the server.
      expect(requests.trace()).toEqual([
        'PUT /api/users/7',
        'GET /api/users',
        'GET /api/users/7'
      ]);
    });
  });

  describe('useDeleteUser', () => {
    it('deletes the user and refreshes the list and that user', async () => {
      const id = ref(7);

      const { remove } = await mountSettled(() => ({
        list: useFetchUsers(),
        one: useFetchUser(id),
        remove: useDeleteUser()
      }));

      await remove.mutateAsync(7);
      await requests.settle();

      expect(requests.trace()).toEqual([
        'DELETE /api/users/7',
        'GET /api/users',
        'GET /api/users/7'
      ]);
    });
  });
});
