import type { User } from '@/types/auth';
import type {
  UsersResponse,
  CreateUserForm,
  UpdateUserForm
} from '@/types/user';

export async function fetchUsers(): Promise<UsersResponse> {
  const response = await fetcher<UsersResponse>('/api/users');

  return response;
}

export async function fetchUser(id: number): Promise<User> {
  const response = await fetcher<User>(`/users/${id}`);

  return response;
}

export async function createUser(userData: CreateUserForm): Promise<User> {
  const response = await fetcher<User>('/users', {
    method: 'POST',
    body: userData
  });

  return response;
}

export async function updateUser(
  id: number,
  userData: UpdateUserForm
): Promise<User> {
  const response = await fetcher<User>(`/users/${id}`, {
    method: 'PUT',
    body: userData
  });

  return response;
}

export async function deleteUser(id: number): Promise<void> {
  await fetcher(`/users/${id}`, {
    method: 'DELETE'
  });
}
