import { UserEnvelopeSchema } from '@/types/auth';
import { UsersResponseSchema } from '@/types/user';

import type { User } from '@/types/auth';
import type {
  UsersResponse,
  CreateUserForm,
  UpdateUserForm
} from '@/types/user';

export async function fetchUsers(): Promise<UsersResponse> {
  const response = await fetcher('/api/users');

  return parseResponse(UsersResponseSchema, response);
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

export async function deleteUser(id: number): Promise<void> {
  await fetcher(`/api/users/${id}`, {
    method: 'DELETE'
  });
}
