// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { server } from '@/mocks/server';
import { recordRequests } from '@/mocks/requests';
import { graphqlHandler } from '@/mocks/graphql';
import { buildUser } from '@/mocks/fixtures';

import { fetchUsersGql, updateUserGql } from '../user.gql';

const requests = recordRequests();

const user = buildUser({
  role: 'admin',
  email_verified_at: '2026-08-01T00:00:00.000000Z'
});

type GqlRequestBody = { query: string; variables: Record<string, unknown> };

async function sentBody(): Promise<GqlRequestBody> {
  return (await requests.at(0)).body as GqlRequestBody;
}

describe('user.gql', () => {
  beforeEach(() => {
    requests.reset();
    // * parseResponse logs the Zod error by design; the mismatch cases would flood stderr.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('fetchUsersGql', () => {
    it('returns the users out of the query payload', async () => {
      server.use(graphqlHandler({ data: { users: [user] } }));

      await expect(fetchUsersGql()).resolves.toEqual([user]);
    });

    it('sends a named query and no variables', async () => {
      server.use(graphqlHandler({ data: { users: [] } }));

      await fetchUsersGql();

      const body = await sentBody();

      // * Named so the operation is recognisable in logs and request mocks.
      expect(body.query).toContain('query Users');
      expect(body.variables).toEqual({});
    });

    it('asks for every field the REST serialization returns', async () => {
      server.use(graphqlHandler({ data: { users: [] } }));

      await fetchUsersGql();

      const body = await sentBody();

      for (const field of Object.keys(user)) {
        expect(body.query).toContain(field);
      }
    });

    it('rejects a payload that does not match the schema', async () => {
      server.use(graphqlHandler({ data: { users: [{ ...user, id: 'one' }] } }));

      await expect(fetchUsersGql()).rejects.toBeInstanceOf(Error);
    });

    it('rejects a payload missing the users field entirely', async () => {
      server.use(graphqlHandler({ data: {} }));

      await expect(fetchUsersGql()).rejects.toBeInstanceOf(Error);
    });
  });

  describe('updateUserGql', () => {
    it('returns the user out of the mutation payload', async () => {
      server.use(graphqlHandler({ data: { updateUser: user } }));

      await expect(updateUserGql({ id: 1, name: 'Renamed' })).resolves.toEqual(
        user
      );
    });

    it('sends a named mutation with the id alongside the changed fields', async () => {
      server.use(graphqlHandler({ data: { updateUser: user } }));

      await updateUserGql({ id: 7, name: 'Renamed', role: 'admin' });

      const body = await sentBody();

      expect(body.query).toContain('mutation UpdateUser');
      // * The id is destructured out and put back as a variable — sending only what changed
      // * is what keeps an edit form from overwriting untouched fields.
      expect(body.variables).toEqual({
        id: 7,
        name: 'Renamed',
        role: 'admin'
      });
    });

    it('rejects a payload that does not match the schema', async () => {
      server.use(
        graphqlHandler({ data: { updateUser: { ...user, role: 'owner' } } })
      );

      await expect(updateUserGql({ id: 1 })).rejects.toBeInstanceOf(Error);
    });
  });
});
