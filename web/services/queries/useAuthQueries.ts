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

import type { AppMutationOptions } from '@/composables/useAppMutation';
import type {
  RegistrationForm,
  Credentials,
  PasswordResetForm,
  User
} from '@/types/auth';
import type { ProfileForm } from '@/types/user';

export const authQueryKeys = {
  register: ['auth', 'register'],
  logIn: ['auth', 'logIn'],
  logOut: ['auth', 'logOut'],
  updateProfile: ['auth', 'updateProfile'],
  resendEmailVerification: ['auth', 'resendEmailVerification'],
  generatePasswordResetEmail: ['auth', 'generatePasswordResetEmail'],
  resetPassword: ['auth', 'resetPassword']
} as const;

export function useRegister(
  options: Omit<
    AppMutationOptions<void, RegistrationForm>,
    'key' | 'mutation'
  > = {}
) {
  const { setUser } = useAuthStore();

  return useAppMutation({
    key: authQueryKeys.register,
    mutation: (credentials: RegistrationForm) => register(credentials),
    ...options,
    onSuccess: async (data, vars, context) => {
      setUser(await fetchCurrentUser());

      await options.onSuccess?.(data, vars, context);
    }
  });
}

export function useLogIn(
  options: Omit<AppMutationOptions<void, Credentials>, 'key' | 'mutation'> = {}
) {
  const { setUser } = useAuthStore();

  return useAppMutation({
    key: authQueryKeys.logIn,
    mutation: (credentials: Credentials) => logIn(credentials),
    ...options,
    onSuccess: async (data, vars, context) => {
      setUser(await fetchCurrentUser());

      await options.onSuccess?.(data, vars, context);
    }
  });
}

export function useLogOut(
  options: Omit<AppMutationOptions<void, void>, 'key' | 'mutation'> = {}
) {
  const { resetUser } = useAuthStore();

  return useAppMutation({
    key: authQueryKeys.logOut,
    mutation: () => logOut(),
    ...options,
    onSuccess: async (data, vars, context) => {
      resetUser();

      await options.onSuccess?.(data, vars, context);
    }
  });
}

export function useUpdateProfile(
  options: Omit<AppMutationOptions<User, ProfileForm>, 'key' | 'mutation'> = {}
) {
  const { setUser } = useAuthStore();

  return useAppMutation({
    key: authQueryKeys.updateProfile,
    mutation: (form: ProfileForm) => updateProfile(form),
    ...options,
    onSuccess: async (data, vars, context) => {
      setUser(data);

      await options.onSuccess?.(data, vars, context);
    }
  });
}

export function useResendEmailVerification(
  options: Omit<AppMutationOptions<void, void>, 'key' | 'mutation'> = {}
) {
  return useAppMutation({
    key: authQueryKeys.resendEmailVerification,
    mutation: () => resendEmailVerification(),
    ...options
  });
}

export function useGeneratePasswordResetEmail(
  options: Omit<
    AppMutationOptions<{ status: string }, { email: string }>,
    'key' | 'mutation'
  > = {}
) {
  return useAppMutation({
    key: authQueryKeys.generatePasswordResetEmail,
    mutation: (form: { email: string }) => generatePasswordResetEmail(form),
    ...options
  });
}

export function useResetPassword(
  options: Omit<
    AppMutationOptions<{ status: string }, PasswordResetForm>,
    'key' | 'mutation'
  > = {}
) {
  return useAppMutation({
    key: authQueryKeys.resetPassword,
    mutation: (form: PasswordResetForm) => resetPassword(form),
    ...options
  });
}
