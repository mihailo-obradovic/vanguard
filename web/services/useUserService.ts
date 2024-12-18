import type { User } from '@/types/auth';

export default function useUserService() {
  async function fetchUsers() {
    try {
      const response = await fetcher('/users');

      return Promise.resolve(response);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async function fetchUser(id: number) {
    try {
      const response = await fetcher(`/users/${id}`);

      return Promise.resolve(response);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async function updateUser(id: number, form: User) {
    try {
      const response = await fetcher(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(form)
      });

      return Promise.resolve(response);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async function deleteUser(id: number) {
    try {
      await fetcher(`/users/${id}`, {
        method: 'DELETE'
      });

      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }

  return {
    fetchUser,
    fetchUsers,
    updateUser,
    deleteUser
  };
}
