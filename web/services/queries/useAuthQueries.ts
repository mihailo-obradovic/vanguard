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

export function useRegister(
  options: Omit<
    AppMutationOptions<User, RegistrationForm>,
    'key' | 'mutation'
  > = {}
) {
  const { setUser } = useAuthStore();

  return useAppMutation({
    // * The user fetch is part of the mutation so its failure lands on the mutation's error path.
    mutation: async (credentials: RegistrationForm) => {
      await register(credentials);

      return fetchCurrentUser();
    },
    ...options,
    onSuccess: async (data, vars, context) => {
      setUser(data);

      await options.onSuccess?.(data, vars, context);
    }
  });
}

export function useLogIn(
  options: Omit<AppMutationOptions<User, Credentials>, 'key' | 'mutation'> = {}
) {
  const { setUser } = useAuthStore();

  return useAppMutation({
    // * The user fetch is part of the mutation so its failure lands on the mutation's error path.
    mutation: async (credentials: Credentials) => {
      await logIn(credentials);

      return fetchCurrentUser();
    },
    ...options,
    onSuccess: async (data, vars, context) => {
      setUser(data);

      await options.onSuccess?.(data, vars, context);
    }
  });
}

export function useRefreshUser(
  options: Omit<AppMutationOptions<User, void>, 'key' | 'mutation'> = {}
) {
  const { setUser } = useAuthStore();

  return useAppMutation({
    mutation: () => fetchCurrentUser(),
    ...options,
    onSuccess: async (data, vars, context) => {
      setUser(data);

      await options.onSuccess?.(data, vars, context);
    }
  });
}

export function useLogOut(
  options: Omit<AppMutationOptions<void, void>, 'key' | 'mutation'> = {}
) {
  const { resetUser } = useAuthStore();

  return useAppMutation({
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
    mutation: (form: PasswordResetForm) => resetPassword(form),
    ...options
  });
}
