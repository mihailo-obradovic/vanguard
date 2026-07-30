import type {
  RegistrationForm,
  Credentials,
  PasswordResetForm,
  User
} from '@/types/auth';
import type { ProfileForm } from '@/types/user';

export async function register(credentials: RegistrationForm) {
  await fetcher('/register', {
    method: 'POST',
    body: credentials
  });
}

export async function logIn(credentials: Credentials) {
  await fetcher('/login', {
    method: 'POST',
    body: credentials
  });
}

export async function updateProfile(form: ProfileForm): Promise<User> {
  const response = await fetcher<{ data: User }>('/api/profile', {
    method: 'PUT',
    body: form
  });

  return response.data;
}

export async function fetchCurrentUser(): Promise<User> {
  return await fetcher<User>('/api/user');
}

export async function logOut() {
  await fetcher('/logout', { method: 'POST' });
}

export async function generatePasswordResetEmail(form: { email: string }) {
  return await fetcher<{ status: string }>('/forgot-password', {
    method: 'POST',
    body: form
  });
}

export async function resetPassword(form: PasswordResetForm) {
  return await fetcher<{ status: string }>('/reset-password', {
    method: 'POST',
    body: form
  });
}

export async function resendEmailVerification() {
  await fetcher('/email/verification-notification', {
    method: 'POST'
  });
}
