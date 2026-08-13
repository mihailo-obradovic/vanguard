// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';

import { fetchUsersGql, updateUserGql } from '../user.gql';

// * Mocked at `gqlFetcher`, one layer above `fetcher`: the translation from GraphQL errors to
// * FetchErrors is gqlFetcher.spec's subject, and these services sit on top of it.
const { gqlFetcher } = vi.hoisted(() => ({
  gqlFetcher: vi.fn<(...args: unknown[]) => Promise<unknown>>()
}));

mockNuxtImport('gqlFetcher', () => gqlFetcher);

const user = {
  id: 1,
  name: 'Mihailo',
  email: 'mihailo@example.com',
  role: 'admin',
  email_verified_at: '2026-08-01T00:00:00.000000Z',
  created_at: '2026-08-01T00:00:00.000000Z',
  updated_at: '2026-08-01T00:00:00.000000Z'
} as const;

function sentDocument() {
  return String(gqlFetcher.mock.calls[0]?.[0]);
}

function sentVariables() {
  return gqlFetcher.mock.calls[0]?.[1];
}

describe('user.gql', () => {
  beforeEach(() => {
    // * parseResponse logs the Zod error by design; the mismatch cases would flood stderr.
    vi.spyOn(console, 'error').mockImplementation(() => {});
    gqlFetcher.mockReset();
  });

  describe('fetchUsersGql', () => {
    it('returns the users out of the query payload', async () => {
      gqlFetcher.mockResolvedValue({ users: [user] });

      await expect(fetchUsersGql()).resolves.toEqual([user]);
    });

    it('sends a named query and no variables', async () => {
      gqlFetcher.mockResolvedValue({ users: [] });

      await fetchUsersGql();

      // * Named so the operation is recognisable in logs and request mocks.
      expect(sentDocument()).toContain('query Users');
      expect(sentVariables()).toBeUndefined();
    });

    it('asks for every field the REST serialization returns', async () => {
      gqlFetcher.mockResolvedValue({ users: [] });

      await fetchUsersGql();

      for (const field of Object.keys(user)) {
        expect(sentDocument()).toContain(field);
      }
    });

    it('rejects a payload that does not match the schema', async () => {
      gqlFetcher.mockResolvedValue({ users: [{ ...user, id: 'one' }] });

      await expect(fetchUsersGql()).rejects.toBeInstanceOf(Error);
    });

    it('rejects a payload missing the users field entirely', async () => {
      gqlFetcher.mockResolvedValue({});

      await expect(fetchUsersGql()).rejects.toBeInstanceOf(Error);
    });
  });

  describe('updateUserGql', () => {
    it('returns the user out of the mutation payload', async () => {
      gqlFetcher.mockResolvedValue({ updateUser: user });

      await expect(updateUserGql({ id: 1, name: 'Renamed' })).resolves.toEqual(
        user
      );
    });

    it('sends a named mutation with the id alongside the changed fields', async () => {
      gqlFetcher.mockResolvedValue({ updateUser: user });

      await updateUserGql({ id: 7, name: 'Renamed', role: 'admin' });

      expect(sentDocument()).toContain('mutation UpdateUser');
      // * The id is destructured out and put back as a variable — sending only what changed
      // * is what keeps an edit form from overwriting untouched fields.
      expect(sentVariables()).toEqual({
        id: 7,
        name: 'Renamed',
        role: 'admin'
      });
    });

    it('rejects a payload that does not match the schema', async () => {
      gqlFetcher.mockResolvedValue({ updateUser: { ...user, role: 'owner' } });

      await expect(updateUserGql({ id: 1 })).rejects.toBeInstanceOf(Error);
    });
  });
});
