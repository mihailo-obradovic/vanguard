import type { User } from '@/types/auth';

export async function fetchUsers() {
  const response = await fetcher('/users');

  return response;
}

export async function fetchUser(id: number) {
  const response = await fetcher(`/users/${id}`);

  return response;
}

export async function updateUser(id: number, form: User) {
  const response = await fetcher(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(form)
  });

  return response;
}

export async function deleteUser(id: number) {
  await fetcher(`/users/${id}`, {
    method: 'DELETE'
  });
}
