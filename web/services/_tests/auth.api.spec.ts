// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';

import { server } from '@/mocks/server';
import { apiUrl } from '@/mocks/api';
import { recordRequests } from '@/mocks/requests';
import { buildUser } from '@/mocks/fixtures';

import {
  register,
  logIn,
  logOut,
  updateProfile,
  fetchCurrentUser,
  generatePasswordResetEmail,
  resetPassword,
  resendEmailVerification
} from '../auth.api';

const requests = recordRequests();

const user = buildUser();

const credentials = {
  email: 'mihailo@example.com',
  password: 'correct-horse'
};

/** The session endpoints answer 204, exactly as the web routes do. */
function noContent(path: string) {
  return http.post(apiUrl(path), () => new HttpResponse(null, { status: 204 }));
}

describe('auth.api', () => {
  beforeEach(() => {
    requests.reset();
    // * parseResponse logs the Zod error by design; the mismatch cases would flood stderr.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  // * The session endpoints live on the web routes, not under /api — the stateful Sanctum
  // * posture depends on it, so the paths are part of the contract these tests hold.
  describe('the session endpoints', () => {
    it('registers against the web route', async () => {
      server.use(noContent('/register'));

      const form = {
        ...credentials,
        name: 'Mihailo',
        password_confirmation: 'correct-horse'
      };

      await register(form);

      const request = await requests.at(0);

      expect(request.method).toBe('POST');
      expect(request.path).toBe('/register');
      expect(request.body).toEqual(form);
    });

    it('logs in against the web route', async () => {
      server.use(noContent('/login'));

      await logIn(credentials);

      const request = await requests.at(0);

      expect(request.path).toBe('/login');
      expect(request.body).toEqual(credentials);
    });

    it('logs out against the web route', async () => {
      server.use(noContent('/logout'));

      await logOut();

      expect(requests.trace()).toEqual(['POST /logout']);
    });

    it('requests a fresh verification mail', async () => {
      server.use(noContent('/email/verification-notification'));

      await resendEmailVerification();

      expect(requests.trace()).toEqual([
        'POST /email/verification-notification'
      ]);
    });
  });

  describe('fetchCurrentUser', () => {
    it('reads the session user and unwraps the envelope', async () => {
      server.use(
        http.get(apiUrl('/api/user'), () => HttpResponse.json({ data: user }))
      );

      await expect(fetchCurrentUser()).resolves.toEqual(user);
      expect(requests.trace()).toEqual(['GET /api/user']);
    });

    it('rejects a user that does not match the schema', async () => {
      server.use(
        http.get(apiUrl('/api/user'), () =>
          HttpResponse.json({ data: { ...user, role: 'superuser' } })
        )
      );

      await expect(fetchCurrentUser()).rejects.toBeInstanceOf(Error);
    });

    it('rejects a bare user that arrives without its envelope', async () => {
      server.use(http.get(apiUrl('/api/user'), () => HttpResponse.json(user)));

      await expect(fetchCurrentUser()).rejects.toBeInstanceOf(Error);
    });
  });

  describe('updateProfile', () => {
    it('puts the form and returns the updated user', async () => {
      server.use(
        http.put(apiUrl('/api/profile'), () =>
          HttpResponse.json({ data: user })
        )
      );

      const form = {
        name: 'Mihailo',
        email: 'mihailo@example.com',
        current_password: 'correct-horse'
      };

      await expect(updateProfile(form)).resolves.toEqual(user);

      const request = await requests.at(0);

      expect(request.method).toBe('PUT');
      expect(request.path).toBe('/api/profile');
      expect(request.body).toEqual(form);
    });
  });

  describe('the password reset endpoints', () => {
    it('requests a reset link and returns the status', async () => {
      server.use(
        http.post(apiUrl('/forgot-password'), () =>
          HttpResponse.json({
            status: 'We have emailed your password reset link.'
          })
        )
      );

      await expect(
        generatePasswordResetEmail({ email: credentials.email })
      ).resolves.toEqual({
        status: 'We have emailed your password reset link.'
      });

      const request = await requests.at(0);

      expect(request.path).toBe('/forgot-password');
      expect(request.body).toEqual({ email: credentials.email });
    });

    it('submits the new password with its token and returns the status', async () => {
      server.use(
        http.post(apiUrl('/reset-password'), () =>
          HttpResponse.json({ status: 'Your password has been reset.' })
        )
      );

      const form = {
        ...credentials,
        token: 'reset-token',
        password_confirmation: 'correct-horse'
      };

      await expect(resetPassword(form)).resolves.toEqual({
        status: 'Your password has been reset.'
      });

      const request = await requests.at(0);

      expect(request.path).toBe('/reset-password');
      expect(request.body).toEqual(form);
    });

    it('rejects a reset response with no status to show the user', async () => {
      server.use(
        http.post(apiUrl('/reset-password'), () => HttpResponse.json({}))
      );

      await expect(
        resetPassword({
          ...credentials,
          token: 'reset-token',
          password_confirmation: 'correct-horse'
        })
      ).rejects.toBeInstanceOf(Error);
    });
  });
});
