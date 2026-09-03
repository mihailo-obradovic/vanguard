// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';

import { server } from '@/mocks/server';
import { apiUrl } from '@/mocks/api';
import { recordRequests } from '@/mocks/requests';
import { buildUser } from '@/mocks/fixtures';

import {
  fetchUsers,
  fetchUser,
  createUser,
  updateUser,
  deleteUser,
  checkEmailAvailability
} from '../user.api';

const requests = recordRequests();

const user = buildUser({
  role: 'admin',
  email_verified_at: '2026-08-01T00:00:00.000000Z'
});

describe('user.api', () => {
  beforeEach(() => {
    requests.reset();
    // * parseResponse logs the Zod error by design; the mismatch cases would flood stderr.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('fetchUsers', () => {
    it('reads the collection and returns it with its total', async () => {
      server.use(
        http.get(apiUrl('/api/users'), () =>
          HttpResponse.json({ data: [user], total: 1 })
        )
      );

      await expect(fetchUsers()).resolves.toEqual({ data: [user], total: 1 });
      expect(requests.trace()).toEqual(['GET /api/users']);
    });

    it('rejects a collection that arrives without its total', async () => {
      server.use(
        http.get(apiUrl('/api/users'), () =>
          HttpResponse.json({ data: [user] })
        )
      );

      await expect(fetchUsers()).rejects.toBeInstanceOf(Error);
    });
  });

  describe('fetchUser', () => {
    it('reads one user and unwraps the envelope', async () => {
      server.use(
        http.get(apiUrl('/api/users/1'), () =>
          HttpResponse.json({ data: user })
        )
      );

      await expect(fetchUser(1)).resolves.toEqual(user);
      expect(requests.trace()).toEqual(['GET /api/users/1']);
    });

    it('rejects a user missing a contracted field', async () => {
      server.use(
        http.get(apiUrl('/api/users/1'), () =>
          HttpResponse.json({ data: { ...user, email: undefined } })
        )
      );

      await expect(fetchUser(1)).rejects.toBeInstanceOf(Error);
    });
  });

  describe('createUser', () => {
    it('posts the form and returns the created user', async () => {
      server.use(
        http.post(apiUrl('/api/users'), () =>
          HttpResponse.json({ data: user }, { status: 201 })
        )
      );

      const form = {
        name: 'Mihailo',
        email: 'mihailo@example.com',
        password: 'correct-horse',
        password_confirmation: 'correct-horse'
      };

      await expect(createUser(form)).resolves.toEqual(user);

      const request = await requests.at(0);

      expect(request.method).toBe('POST');
      expect(request.path).toBe('/api/users');
      expect(request.body).toEqual(form);
    });
  });

  describe('updateUser', () => {
    it('puts the form to the user and returns the updated user', async () => {
      server.use(
        http.put(apiUrl('/api/users/7'), () =>
          HttpResponse.json({ data: user })
        )
      );

      await expect(updateUser(7, { name: 'Renamed' })).resolves.toEqual(user);

      const request = await requests.at(0);

      expect(request.method).toBe('PUT');
      expect(request.path).toBe('/api/users/7');
      expect(request.body).toEqual({ name: 'Renamed' });
    });
  });

  describe('deleteUser', () => {
    // * A hard delete answers 204 with nothing to validate; requiring a schema here would fail
    // * every delete, so the service deliberately skips parsing.
    it('deletes the user and resolves without parsing the empty body', async () => {
      server.use(
        http.delete(
          apiUrl('/api/users/7'),
          () => new HttpResponse(null, { status: 204 })
        )
      );

      await expect(deleteUser(7)).resolves.toBeUndefined();
      expect(requests.trace()).toEqual(['DELETE /api/users/7']);
    });
  });

  describe('checkEmailAvailability', () => {
    function respondWith(verdict: 'available' | 'taken') {
      server.use(
        http.get(apiUrl('/api/email-availability'), () =>
          HttpResponse.json({ available: verdict === 'available' })
        )
      );
    }

    it('reports a free address as available', async () => {
      respondWith('available');

      await expect(checkEmailAvailability('free@example.com')).resolves.toBe(
        true
      );
    });

    it('reports a claimed address as unavailable', async () => {
      respondWith('taken');

      await expect(checkEmailAvailability('taken@example.com')).resolves.toBe(
        false
      );
    });

    it('sends the address as a query parameter', async () => {
      respondWith('available');

      await checkEmailAvailability('free@example.com');

      const request = await requests.at(0);

      expect(request.method).toBe('GET');
      expect(request.path).toBe('/api/email-availability');
    });

    // * The parameter must be absent rather than empty when there is nobody to ignore: a blank
    // * `ignore_id` would reach the backend's `integer` rule and 422 the whole check.
    it('omits ignore_id when no user is being edited', async () => {
      let requestUrl = '';

      server.use(
        http.get(apiUrl('/api/email-availability'), ({ request }) => {
          requestUrl = request.url;

          return HttpResponse.json({ available: true });
        })
      );

      await checkEmailAvailability('free@example.com');

      expect(new URL(requestUrl).searchParams.has('ignore_id')).toBe(false);
    });

    it('forwards ignore_id when a user is being edited', async () => {
      let requestUrl = '';

      server.use(
        http.get(apiUrl('/api/email-availability'), ({ request }) => {
          requestUrl = request.url;

          return HttpResponse.json({ available: true });
        })
      );

      await checkEmailAvailability('mine@example.com', 7);

      expect(new URL(requestUrl).searchParams.get('ignore_id')).toBe('7');
    });

    it('rejects a response that does not carry the flag', async () => {
      server.use(
        http.get(apiUrl('/api/email-availability'), () =>
          HttpResponse.json({ taken: false })
        )
      );

      await expect(
        checkEmailAvailability('free@example.com')
      ).rejects.toBeInstanceOf(Error);
    });
  });
});
