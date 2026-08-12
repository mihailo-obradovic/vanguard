// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';

import {
  fetchUsers,
  fetchUser,
  createUser,
  updateUser,
  deleteUser
} from '../user.api';

// * `fetcher` is auto-imported, so it is replaced through Nuxt's import mocking rather than a
// * module mock. `vi.hoisted` is required: mockNuxtImport is hoisted above the declaration.
const { fetcher } = vi.hoisted(() => ({
  fetcher: vi.fn<(...args: unknown[]) => Promise<unknown>>()
}));

mockNuxtImport('fetcher', () => fetcher);

// * Mirrors UserResource — the envelope these services are only honest about if it stays the
// * shape the backend actually sends (tests/Feature asserts the same fields server-side).
const user = {
  id: 1,
  name: 'Mihailo',
  email: 'mihailo@example.com',
  role: 'admin',
  email_verified_at: '2026-08-01T00:00:00.000000Z',
  created_at: '2026-08-01T00:00:00.000000Z',
  updated_at: '2026-08-01T00:00:00.000000Z'
} as const;

describe('user.api', () => {
  beforeEach(() => {
    // * parseResponse logs the Zod error by design; the mismatch cases would flood stderr.
    vi.spyOn(console, 'error').mockImplementation(() => {});
    fetcher.mockReset();
  });

  describe('fetchUsers', () => {
    it('reads the collection and returns it with its total', async () => {
      fetcher.mockResolvedValue({ data: [user], total: 1 });

      await expect(fetchUsers()).resolves.toEqual({ data: [user], total: 1 });
      expect(fetcher).toHaveBeenCalledWith('/api/users');
    });

    it('rejects a response that does not match the schema', async () => {
      fetcher.mockResolvedValue({ data: [user] });

      await expect(fetchUsers()).rejects.toBeInstanceOf(Error);
    });
  });

  describe('fetchUser', () => {
    it('reads one user and unwraps the envelope', async () => {
      fetcher.mockResolvedValue({ data: user });

      await expect(fetchUser(1)).resolves.toEqual(user);
      expect(fetcher).toHaveBeenCalledWith('/api/users/1');
    });

    it('rejects a user missing a contracted field', async () => {
      const withoutEmail = { ...user, email: undefined };

      fetcher.mockResolvedValue({ data: withoutEmail });

      await expect(fetchUser(1)).rejects.toBeInstanceOf(Error);
    });
  });

  describe('createUser', () => {
    it('posts the form and returns the created user', async () => {
      fetcher.mockResolvedValue({ data: user });

      const form = {
        name: 'Mihailo',
        email: 'mihailo@example.com',
        password: 'correct-horse',
        password_confirmation: 'correct-horse'
      };

      await expect(createUser(form)).resolves.toEqual(user);
      expect(fetcher).toHaveBeenCalledWith('/api/users', {
        method: 'POST',
        body: form
      });
    });
  });

  describe('updateUser', () => {
    it('puts the form to the user and returns the updated user', async () => {
      fetcher.mockResolvedValue({ data: user });

      await expect(updateUser(7, { name: 'Renamed' })).resolves.toEqual(user);
      expect(fetcher).toHaveBeenCalledWith('/api/users/7', {
        method: 'PUT',
        body: { name: 'Renamed' }
      });
    });
  });

  describe('deleteUser', () => {
    it('deletes the user and resolves with nothing', async () => {
      fetcher.mockResolvedValue(undefined);

      await expect(deleteUser(7)).resolves.toBeUndefined();
      expect(fetcher).toHaveBeenCalledWith('/api/users/7', {
        method: 'DELETE'
      });
    });

    it('does not parse the empty body a hard delete returns', async () => {
      // * A 204 carries nothing to validate; requiring a schema here would fail every delete.
      fetcher.mockResolvedValue('');

      await expect(deleteUser(7)).resolves.toBeUndefined();
    });
  });
});
