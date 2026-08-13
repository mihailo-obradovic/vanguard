// @vitest-environment nuxt
import { describe, it, expect, beforeEach } from 'vitest';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { PiniaColada } from '@pinia/colada';
import { http, HttpResponse } from 'msw';
import { defineComponent } from 'vue';

import { server } from '@/mocks/server';
import { apiUrl } from '@/mocks/api';
import { recordRequests } from '@/mocks/requests';
import { buildUser } from '@/mocks/fixtures';
import { userHandlers } from '@/mocks/handlers/user';
import { GRAPHQL_PATH } from '@/mocks/graphql';

import { usersQueryKeys, useFetchUsers } from '../useUserQueries';
import {
  usersGqlQueryKeys,
  useFetchUsersGql,
  useUpdateUserGql
} from '../useUserGqlQueries';

// * Stubbed because it reaches for the router and the toast plugin, neither of which this spec
// * is about; its own behaviour is covered in setupQueryErrorHandling.spec.ts.
mockNuxtImport('setupQueryErrorHandling', () => () => {});

const requests = recordRequests();

const user = buildUser({ id: 7, role: 'admin' });

/** Both operations post to the same path, so the trace names them by document instead. */
async function trace(): Promise<string[]> {
  const out: string[] = [];

  for (let index = 0; index < requests.count(); index += 1) {
    const request = await requests.at(index);

    if (request.path !== GRAPHQL_PATH) {
      out.push(`${request.method} ${request.path}`);
      continue;
    }

    const { query } = request.body as { query: string };

    out.push(
      query.includes('mutation UpdateUser') ? 'gql UpdateUser' : 'gql Users'
    );
  }

  return out;
}

function graphqlHandlers() {
  return [
    http.post(apiUrl(GRAPHQL_PATH), async ({ request }) => {
      const { query } = (await request.json()) as { query: string };

      return HttpResponse.json({
        data: query.includes('mutation UpdateUser')
          ? { updateUser: { ...user, name: 'Renamed' } }
          : { users: [user] }
      });
    })
  ];
}

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

async function mountSettled<T extends Record<string, unknown>>(
  use: () => T
): Promise<T> {
  const result = mountQueries(use);

  await requests.settle();
  requests.reset();

  return result;
}

describe('useUserGqlQueries', () => {
  beforeEach(() => {
    requests.reset();
    server.use(...graphqlHandlers(), ...userHandlers(user));
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
      const { list } = mountQueries(() => ({ list: useFetchUsersGql() }));

      await flushPromises();

      expect(await trace()).toEqual(['gql Users']);
      expect(list.data.value).toEqual([user]);
    });
  });

  describe('useUpdateUserGql', () => {
    it('updates through GraphQL and refreshes its own list', async () => {
      const { update } = await mountSettled(() => ({
        list: useFetchUsersGql(),
        update: useUpdateUserGql()
      }));

      await update.mutateAsync({ id: 7, name: 'Renamed' });
      await requests.settle();

      expect(await trace()).toEqual(['gql UpdateUser', 'gql Users']);
      expect((await requests.at(0)).body).toMatchObject({
        variables: { id: 7, name: 'Renamed' }
      });
    });

    it('leaves the REST users list alone', async () => {
      const { update } = await mountSettled(() => ({
        gqlList: useFetchUsersGql(),
        restList: useFetchUsers(),
        update: useUpdateUserGql()
      }));

      await update.mutateAsync({ id: 7, name: 'Renamed' });
      await requests.settle();

      // * The REST list is mounted and would refetch if its key had been invalidated.
      expect(await trace()).not.toContain('GET /api/users');
    });

    it('runs the caller onSettled after the list has been refreshed', async () => {
      let countWhenCallerRan = 0;

      const { update } = await mountSettled(() => ({
        list: useFetchUsersGql(),
        update: useUpdateUserGql({
          onSettled: () => {
            countWhenCallerRan = requests.count();
          }
        })
      }));

      await update.mutateAsync({ id: 7, name: 'Renamed' });

      // * The mutation and the refetch it triggered, both before the caller's hook.
      expect(countWhenCallerRan).toBe(2);
    });

    it('refreshes the list even when the update fails', async () => {
      server.use(
        http.post(apiUrl(GRAPHQL_PATH), async ({ request }) => {
          const { query } = (await request.json()) as { query: string };

          return query.includes('mutation UpdateUser')
            ? HttpResponse.json({
                data: null,
                errors: [
                  { message: 'Request failed', extensions: { status: 500 } }
                ]
              })
            : HttpResponse.json({ data: { users: [user] } });
        })
      );

      const { update } = await mountSettled(() => ({
        list: useFetchUsersGql(),
        update: useUpdateUserGql()
      }));

      await expect(
        update.mutateAsync({ id: 7, name: 'Renamed' })
      ).rejects.toBeInstanceOf(Error);
      await requests.settle();

      expect(await trace()).toEqual(['gql UpdateUser', 'gql Users']);
    });
  });
});
