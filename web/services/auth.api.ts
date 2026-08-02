import { z } from 'zod';

import { UserEnvelopeSchema } from '@/types/auth';

import type {
  RegistrationForm,
  Credentials,
  PasswordResetForm,
  User
} from '@/types/auth';
import type { ProfileForm } from '@/types/user';

const StatusSchema = z.object({ status: z.string() });

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
  const response = await fetcher('/api/profile', {
    method: 'PUT',
    body: form
  });

  return parseResponse(UserEnvelopeSchema, response).data;
}

export async function fetchCurrentUser(): Promise<User> {
  return parseResponse(UserEnvelopeSchema, await fetcher('/api/user')).data;
}

export async function logOut() {
  await fetcher('/logout', { method: 'POST' });
}

export async function generatePasswordResetEmail(form: { email: string }) {
  const response = await fetcher('/forgot-password', {
    method: 'POST',
    body: form
  });

  return parseResponse(StatusSchema, response);
}

export async function resetPassword(form: PasswordResetForm) {
  const response = await fetcher('/reset-password', {
    method: 'POST',
    body: form
  });

  return parseResponse(StatusSchema, response);
}

export async function resendEmailVerification() {
  await fetcher('/email/verification-notification', {
    method: 'POST'
  });
}
