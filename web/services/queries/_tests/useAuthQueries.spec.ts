// @vitest-environment nuxt
import { describe, it, expect, beforeEach } from 'vitest';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { PiniaColada } from '@pinia/colada';
import { http, HttpResponse } from 'msw';
import { defineComponent } from 'vue';

import { server } from '@/mocks/server';
import { apiUrl } from '@/mocks/api';
import { recordRequests } from '@/mocks/requests';
import { buildUser } from '@/mocks/fixtures';
import { authHandlers } from '@/mocks/handlers/auth';
import { useAuthStore } from '@/stores/useAuthStore';

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

// * Stubbed because it reaches for the router and the toast plugin, neither of which this spec
// * is about; its own behaviour is covered in setupQueryErrorHandling.spec.ts.
mockNuxtImport('setupQueryErrorHandling', () => () => {});

const requests = recordRequests();

const user = buildUser();

const credentials = {
  email: 'mihailo@example.com',
  password: 'correct-horse'
};

const registration = {
  ...credentials,
  name: 'Mihailo',
  password_confirmation: 'correct-horse'
};

/**
 * Mount a mutation against the real auth store.
 *
 * * One pinia for both the component and the spec, so what the composable writes is what the
 * * assertions read — the store is in-process state this app owns, not a mocked collaborator.
 */
function mountMutation<T>(use: () => T) {
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

  return { mutation: wrapper.vm.result as T, store: useAuthStore(pinia) };
}

describe('useAuthQueries', () => {
  beforeEach(() => {
    requests.reset();
    server.use(...authHandlers(user));
  });

  describe('useRegister', () => {
    it('registers, then loads the session user into the store', async () => {
      const { mutation, store } = mountMutation(() => useRegister());

      await mutation.mutateAsync(registration);

      expect(requests.trace()).toEqual(['POST /register', 'GET /api/user']);
      expect(store.user).toEqual(user);
    });

    it('fails the mutation when the follow-up user fetch fails', async () => {
      server.use(
        http.get(apiUrl('/api/user'), () =>
          HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })
        )
      );

      const { mutation, store } = mountMutation(() => useRegister());

      // * The fetch lives inside the mutation so its failure lands on the mutation's error
      // * path rather than leaving a half-registered session behind.
      await expect(mutation.mutateAsync(registration)).rejects.toBeInstanceOf(
        Error
      );
      expect(store.user).toBeNull();
    });
  });

  describe('useLogIn', () => {
    it('logs in, then loads the session user into the store', async () => {
      const { mutation, store } = mountMutation(() => useLogIn());

      await mutation.mutateAsync(credentials);

      expect(requests.trace()).toEqual(['POST /login', 'GET /api/user']);
      expect(store.user).toEqual(user);
    });

    it('runs the caller onSuccess after the store is populated', async () => {
      let userWhenCallerRan: unknown = 'never ran';

      const { mutation, store } = mountMutation(() =>
        useLogIn({
          onSuccess: () => {
            userWhenCallerRan = store.user;
          }
        })
      );

      await mutation.mutateAsync(credentials);

      // * A caller redirecting on success must find the store already populated.
      expect(userWhenCallerRan).toEqual(user);
    });

    it('leaves the store untouched when the credentials are refused', async () => {
      server.use(
        http.post(apiUrl('/login'), () =>
          HttpResponse.json(
            { message: 'These credentials do not match our records.' },
            { status: 422 }
          )
        )
      );

      const { mutation, store } = mountMutation(() => useLogIn());

      await expect(mutation.mutateAsync(credentials)).rejects.toBeInstanceOf(
        Error
      );
      // * No user fetch either — the session was never established.
      expect(requests.trace()).toEqual(['POST /login']);
      expect(store.user).toBeNull();
    });
  });

  describe('useRefreshUser', () => {
    it('reloads the session user into the store', async () => {
      const { mutation, store } = mountMutation(() => useRefreshUser());

      await mutation.mutateAsync();

      expect(requests.trace()).toEqual(['GET /api/user']);
      expect(store.user).toEqual(user);
    });
  });

  describe('useLogOut', () => {
    it('clears the store once the server has ended the session', async () => {
      const { mutation, store } = mountMutation(() => useLogOut());

      store.setUser(user);

      await mutation.mutateAsync();

      expect(requests.trace()).toEqual(['POST /logout']);
      expect(store.user).toBeNull();
    });

    it('keeps the user signed in when the logout request fails', async () => {
      server.use(
        http.post(apiUrl('/logout'), () =>
          HttpResponse.json({ message: 'Request failed' }, { status: 500 })
        )
      );

      const { mutation, store } = mountMutation(() => useLogOut());

      store.setUser(user);

      await expect(mutation.mutateAsync()).rejects.toBeInstanceOf(Error);
      expect(store.user).toEqual(user);
    });
  });

  describe('useUpdateProfile', () => {
    it('stores the updated user so the header reflects the change', async () => {
      const { mutation, store } = mountMutation(() => useUpdateProfile());

      const form = {
        name: 'Renamed',
        email: 'mihailo@example.com',
        current_password: 'correct-horse'
      };

      await mutation.mutateAsync(form);

      expect((await requests.at(0)).body).toEqual(form);
      expect(store.user?.name).toBe('Renamed');
    });
  });

  describe('the mutations with no session side effect', () => {
    it('resends the verification mail without touching the store', async () => {
      const { mutation, store } = mountMutation(() =>
        useResendEmailVerification()
      );

      await mutation.mutateAsync();

      expect(requests.trace()).toEqual([
        'POST /email/verification-notification'
      ]);
      expect(store.user).toBeNull();
    });

    it('requests a reset link and returns its status', async () => {
      const { mutation, store } = mountMutation(() =>
        useGeneratePasswordResetEmail()
      );

      await expect(
        mutation.mutateAsync({ email: credentials.email })
      ).resolves.toEqual({
        status: 'We have emailed your password reset link.'
      });
      expect(store.user).toBeNull();
    });

    it('resets the password without signing the user in', async () => {
      const { mutation, store } = mountMutation(() => useResetPassword());

      await expect(
        mutation.mutateAsync({
          ...credentials,
          token: 'reset-token',
          password_confirmation: 'correct-horse'
        })
      ).resolves.toEqual({ status: 'Your password has been reset.' });
      // * The reset flow ends on the login page; it never establishes a session itself.
      expect(store.user).toBeNull();
    });
  });
});
