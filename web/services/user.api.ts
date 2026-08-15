import { z } from 'zod';

import { UserEnvelopeSchema } from '@/types/auth';
import { UsersResponseSchema } from '@/types/user';

import type { User } from '@/types/auth';
import type {
  UsersResponse,
  CreateUserForm,
  UpdateUserForm
} from '@/types/user';

// * Response-only and used nowhere else, so it stays here rather than in @/types.
const EmailAvailabilitySchema = z.object({ available: z.boolean() });

export async function fetchUsers(): Promise<UsersResponse> {
  const response = await fetcher('/api/users');

  return parseResponse(UsersResponseSchema, response);
}

export async function fetchUser(id: number): Promise<User> {
  const response = await fetcher(`/api/users/${id}`);

  return parseResponse(UserEnvelopeSchema, response).data;
}

export async function createUser(userData: CreateUserForm): Promise<User> {
  const response = await fetcher('/api/users', {
    method: 'POST',
    body: userData
  });

  return parseResponse(UserEnvelopeSchema, response).data;
}

export async function updateUser(
  id: number,
  userData: UpdateUserForm
): Promise<User> {
  const response = await fetcher(`/api/users/${id}`, {
    method: 'PUT',
    body: userData
  });

  return parseResponse(UserEnvelopeSchema, response).data;
}

// * `ignoreId` excludes the user being edited, so keeping your own address does not read as taken.
export async function checkEmailAvailability(
  email: string,
  ignoreId?: number
): Promise<boolean> {
  const response = await fetcher('/api/email-availability', {
    query: { email, ...(ignoreId ? { ignore_id: ignoreId } : {}) }
  });

  return parseResponse(EmailAvailabilitySchema, response).available;
}

export async function deleteUser(id: number): Promise<void> {
  await fetcher(`/api/users/${id}`, {
    method: 'DELETE'
  });
}
