// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { PiniaColada } from '@pinia/colada';
import { defineComponent } from 'vue';

import {
  register,
  logIn,
  logOut,
  updateProfile,
  fetchCurrentUser,
  generatePasswordResetEmail,
  resetPassword,
  resendEmailVerification
} from '@/services/auth.api';

import {
  useRegister,
  useLogIn,
  useLogOut,
  useRefreshUser,
  useUpdateProfile,
  useResendEmailVerification,
  useGeneratePasswordResetEmail,
  useResetPassword
} from '../useAuthQueries';

vi.mock('@/services/auth.api', () => ({
  register: vi.fn<() => Promise<unknown>>(),
  logIn: vi.fn<() => Promise<unknown>>(),
  logOut: vi.fn<() => Promise<unknown>>(),
  updateProfile: vi.fn<() => Promise<unknown>>(),
  fetchCurrentUser: vi.fn<() => Promise<unknown>>(),
  generatePasswordResetEmail: vi.fn<() => Promise<unknown>>(),
  resetPassword: vi.fn<() => Promise<unknown>>(),
  resendEmailVerification: vi.fn<() => Promise<unknown>>()
}));

const { setUser, resetUser } = vi.hoisted(() => ({
  setUser: vi.fn<(...args: unknown[]) => void>(),
  resetUser: vi.fn<() => void>()
}));

mockNuxtImport('useAuthStore', () => () => ({ setUser, resetUser }));
mockNuxtImport('setupQueryErrorHandling', () => () => {});

const user = {
  id: 1,
  name: 'Mihailo',
  email: 'mihailo@example.com',
  role: 'user' as const,
  email_verified_at: null,
  created_at: '2026-08-01T00:00:00.000000Z',
  updated_at: '2026-08-01T00:00:00.000000Z'
};

const credentials = {
  email: 'mihailo@example.com',
  password: 'correct-horse'
};

function mountMutation<T>(use: () => T) {
  const wrapper = mount(
    defineComponent({
      setup() {
        return { result: use() };
      },
      template: '<div />'
    }),
    { global: { plugins: [createPinia(), PiniaColada] } }
  );

  return wrapper.vm.result;
}

describe('useAuthQueries', () => {
  beforeEach(() => {
    // * Implementations are re-stated below; this only drops the call history, which would
    // * otherwise leak between cases.
    vi.clearAllMocks();
    setActivePinia(createPinia());
    vi.mocked(fetchCurrentUser).mockResolvedValue(user);
    vi.mocked(register).mockResolvedValue(undefined);
    vi.mocked(logIn).mockResolvedValue(undefined);
    vi.mocked(logOut).mockResolvedValue(undefined);
    vi.mocked(updateProfile).mockResolvedValue(user);
    vi.mocked(resendEmailVerification).mockResolvedValue(undefined);
    vi.mocked(generatePasswordResetEmail).mockResolvedValue({ status: 'sent' });
    vi.mocked(resetPassword).mockResolvedValue({ status: 'reset' });
  });

  describe('useRegister', () => {
    it('registers, then loads the session user and stores it', async () => {
      const mutation = mountMutation(() => useRegister());

      await mutation.mutateAsync({
        ...credentials,
        name: 'Mihailo',
        password_confirmation: 'correct-horse'
      });

      expect(register).toHaveBeenCalledOnce();
      expect(fetchCurrentUser).toHaveBeenCalledOnce();
      expect(setUser).toHaveBeenCalledWith(user);
    });

    it('fails the mutation when the follow-up user fetch fails', async () => {
      vi.mocked(fetchCurrentUser).mockRejectedValue(new Error('Unauthorized'));

      const mutation = mountMutation(() => useRegister());

      // * The fetch lives inside the mutation so its failure lands on the mutation's error
      // * path rather than leaving a half-registered session behind.
      await expect(
        mutation.mutateAsync({
          ...credentials,
          name: 'Mihailo',
          password_confirmation: 'correct-horse'
        })
      ).rejects.toBeInstanceOf(Error);
      expect(setUser).not.toHaveBeenCalled();
    });
  });

  describe('useLogIn', () => {
    it('logs in, then loads the session user and stores it', async () => {
      const mutation = mountMutation(() => useLogIn());

      await mutation.mutateAsync(credentials);

      expect(logIn).toHaveBeenCalledWith(credentials);
      expect(fetchCurrentUser).toHaveBeenCalledOnce();
      expect(setUser).toHaveBeenCalledWith(user);
    });

    it('runs the caller onSuccess after the store is populated', async () => {
      const order: string[] = [];

      setUser.mockImplementation(() => {
        order.push('setUser');
      });

      const mutation = mountMutation(() =>
        useLogIn({
          onSuccess: () => {
            order.push('caller');
          }
        })
      );

      await mutation.mutateAsync(credentials);

      // * A caller redirecting on success must find the store already populated.
      expect(order).toEqual(['setUser', 'caller']);
    });

    it('leaves the store untouched when the credentials are refused', async () => {
      vi.mocked(logIn).mockRejectedValue(new Error('Invalid credentials'));

      const mutation = mountMutation(() => useLogIn());

      await expect(mutation.mutateAsync(credentials)).rejects.toBeInstanceOf(
        Error
      );
      expect(fetchCurrentUser).not.toHaveBeenCalled();
      expect(setUser).not.toHaveBeenCalled();
    });
  });

  describe('useRefreshUser', () => {
    it('reloads the session user into the store', async () => {
      const mutation = mountMutation(() => useRefreshUser());

      await mutation.mutateAsync();

      expect(fetchCurrentUser).toHaveBeenCalledOnce();
      expect(setUser).toHaveBeenCalledWith(user);
    });
  });

  describe('useLogOut', () => {
    it('clears the store once the server has ended the session', async () => {
      const mutation = mountMutation(() => useLogOut());

      await mutation.mutateAsync();

      expect(logOut).toHaveBeenCalledOnce();
      expect(resetUser).toHaveBeenCalledOnce();
    });

    it('keeps the user signed in when the logout request fails', async () => {
      vi.mocked(logOut).mockRejectedValue(new Error('Request failed'));

      const mutation = mountMutation(() => useLogOut());

      await expect(mutation.mutateAsync()).rejects.toBeInstanceOf(Error);
      expect(resetUser).not.toHaveBeenCalled();
    });
  });

  describe('useUpdateProfile', () => {
    it('stores the updated user so the header reflects the change', async () => {
      const mutation = mountMutation(() => useUpdateProfile());

      const form = {
        name: 'Renamed',
        email: 'mihailo@example.com',
        current_password: 'correct-horse'
      };

      await mutation.mutateAsync(form);

      expect(updateProfile).toHaveBeenCalledWith(form);
      expect(setUser).toHaveBeenCalledWith(user);
    });
  });

  describe('the mutations with no session side effect', () => {
    it('resends the verification mail without touching the store', async () => {
      const mutation = mountMutation(() => useResendEmailVerification());

      await mutation.mutateAsync();

      expect(resendEmailVerification).toHaveBeenCalledOnce();
      expect(setUser).not.toHaveBeenCalled();
      expect(resetUser).not.toHaveBeenCalled();
    });

    it('requests a reset link and returns its status', async () => {
      const mutation = mountMutation(() => useGeneratePasswordResetEmail());

      await expect(
        mutation.mutateAsync({ email: credentials.email })
      ).resolves.toEqual({ status: 'sent' });
      expect(setUser).not.toHaveBeenCalled();
    });

    it('resets the password without signing the user in', async () => {
      const mutation = mountMutation(() => useResetPassword());

      await expect(
        mutation.mutateAsync({
          ...credentials,
          token: 'reset-token',
          password_confirmation: 'correct-horse'
        })
      ).resolves.toEqual({ status: 'reset' });
      // * The reset flow ends on the login page; it never establishes a session itself.
      expect(setUser).not.toHaveBeenCalled();
    });
  });
});
