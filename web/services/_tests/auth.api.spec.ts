// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';

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

const { fetcher } = vi.hoisted(() => ({
  fetcher: vi.fn<(...args: unknown[]) => Promise<unknown>>()
}));

mockNuxtImport('fetcher', () => fetcher);

const user = {
  id: 1,
  name: 'Mihailo',
  email: 'mihailo@example.com',
  role: 'user',
  email_verified_at: null,
  created_at: '2026-08-01T00:00:00.000000Z',
  updated_at: '2026-08-01T00:00:00.000000Z'
} as const;

const credentials = {
  email: 'mihailo@example.com',
  password: 'correct-horse'
};

describe('auth.api', () => {
  beforeEach(() => {
    // * parseResponse logs the Zod error by design; the mismatch cases would flood stderr.
    vi.spyOn(console, 'error').mockImplementation(() => {});
    fetcher.mockReset();
    fetcher.mockResolvedValue(undefined);
  });

  // * The session endpoints live on the web routes, not under /api — the stateful Sanctum
  // * posture depends on it, so the paths are part of the contract these tests hold.
  describe('the session endpoints', () => {
    it('registers against the web route', async () => {
      const form = {
        ...credentials,
        name: 'Mihailo',
        password_confirmation: 'correct-horse'
      };

      await register(form);

      expect(fetcher).toHaveBeenCalledWith('/register', {
        method: 'POST',
        body: form
      });
    });

    it('logs in against the web route', async () => {
      await logIn(credentials);

      expect(fetcher).toHaveBeenCalledWith('/login', {
        method: 'POST',
        body: credentials
      });
    });

    it('logs out against the web route', async () => {
      await logOut();

      expect(fetcher).toHaveBeenCalledWith('/logout', { method: 'POST' });
    });

    it('requests a fresh verification mail', async () => {
      await resendEmailVerification();

      expect(fetcher).toHaveBeenCalledWith('/email/verification-notification', {
        method: 'POST'
      });
    });
  });

  describe('fetchCurrentUser', () => {
    it('reads the session user and unwraps the envelope', async () => {
      fetcher.mockResolvedValue({ data: user });

      await expect(fetchCurrentUser()).resolves.toEqual(user);
      expect(fetcher).toHaveBeenCalledWith('/api/user');
    });

    it('rejects a user that does not match the schema', async () => {
      fetcher.mockResolvedValue({ data: { ...user, role: 'superuser' } });

      await expect(fetchCurrentUser()).rejects.toBeInstanceOf(Error);
    });

    it('rejects a bare user that arrives without its envelope', async () => {
      fetcher.mockResolvedValue(user);

      await expect(fetchCurrentUser()).rejects.toBeInstanceOf(Error);
    });
  });

  describe('updateProfile', () => {
    it('puts the form and returns the updated user', async () => {
      fetcher.mockResolvedValue({ data: user });

      const form = {
        name: 'Mihailo',
        email: 'mihailo@example.com',
        current_password: 'correct-horse'
      };

      await expect(updateProfile(form)).resolves.toEqual(user);
      expect(fetcher).toHaveBeenCalledWith('/api/profile', {
        method: 'PUT',
        body: form
      });
    });
  });

  describe('the password reset endpoints', () => {
    it('requests a reset link and returns the status', async () => {
      fetcher.mockResolvedValue({
        status: 'We have emailed your password reset link.'
      });

      await expect(
        generatePasswordResetEmail({ email: credentials.email })
      ).resolves.toEqual({
        status: 'We have emailed your password reset link.'
      });
      expect(fetcher).toHaveBeenCalledWith('/forgot-password', {
        method: 'POST',
        body: { email: credentials.email }
      });
    });

    it('submits the new password with its token and returns the status', async () => {
      fetcher.mockResolvedValue({ status: 'Your password has been reset.' });

      const form = {
        ...credentials,
        token: 'reset-token',
        password_confirmation: 'correct-horse'
      };

      await expect(resetPassword(form)).resolves.toEqual({
        status: 'Your password has been reset.'
      });
      expect(fetcher).toHaveBeenCalledWith('/reset-password', {
        method: 'POST',
        body: form
      });
    });

    it('rejects a reset response with no status to show the user', async () => {
      fetcher.mockResolvedValue({});

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
