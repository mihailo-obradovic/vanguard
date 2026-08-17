import {
  register,
  logIn,
  updateProfile,
  fetchCurrentUser,
  logOut,
  generatePasswordResetEmail,
  resetPassword,
  resendEmailVerification
} from '@/services/auth.api';

import type { MutationOptions } from '@/composables/useAppMutation';
import type {
  RegistrationForm,
  Credentials,
  PasswordResetForm,
  User
} from '@/types/auth';
import type { ProfileForm } from '@/types/user';

export function useRegister(
  options: MutationOptions<User, RegistrationForm> = {}
) {
  const { setUser } = useAuthStore();

  return useAppMutation({
    // * The user fetch is part of the mutation so its failure lands on the mutation's error path.
    mutation: async (credentials: RegistrationForm) => {
      await register(credentials);

      return fetchCurrentUser();
    },
    ...options,
    onSuccess: chainAfter((data: User) => setUser(data), options.onSuccess)
  });
}

export function useLogIn(options: MutationOptions<User, Credentials> = {}) {
  const { setUser } = useAuthStore();

  return useAppMutation({
    // * The user fetch is part of the mutation so its failure lands on the mutation's error path.
    mutation: async (credentials: Credentials) => {
      await logIn(credentials);

      return fetchCurrentUser();
    },
    ...options,
    onSuccess: chainAfter((data: User) => setUser(data), options.onSuccess)
  });
}

export function useRefreshUser(options: MutationOptions<User> = {}) {
  const { setUser } = useAuthStore();

  return useAppMutation({
    mutation: () => fetchCurrentUser(),
    ...options,
    onSuccess: chainAfter((data: User) => setUser(data), options.onSuccess)
  });
}

export function useLogOut(options: MutationOptions<void> = {}) {
  const { resetUser } = useAuthStore();

  return useAppMutation({
    mutation: () => logOut(),
    ...options,
    onSuccess: chainAfter(() => resetUser(), options.onSuccess)
  });
}

export function useUpdateProfile(
  options: MutationOptions<User, ProfileForm> = {}
) {
  const { setUser } = useAuthStore();

  return useAppMutation({
    mutation: (form: ProfileForm) => updateProfile(form),
    ...options,
    onSuccess: chainAfter((data: User) => setUser(data), options.onSuccess)
  });
}

export function useResendEmailVerification(
  options: MutationOptions<void> = {}
) {
  return useAppMutation({
    mutation: () => resendEmailVerification(),
    ...options
  });
}

export function useGeneratePasswordResetEmail(
  options: MutationOptions<{ status: string }, { email: string }> = {}
) {
  return useAppMutation({
    mutation: (form: { email: string }) => generatePasswordResetEmail(form),
    ...options
  });
}

export function useResetPassword(
  options: MutationOptions<{ status: string }, PasswordResetForm> = {}
) {
  return useAppMutation({
    mutation: (form: PasswordResetForm) => resetPassword(form),
    ...options
  });
}
