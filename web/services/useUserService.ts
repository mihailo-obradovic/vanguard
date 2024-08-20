import type { User } from '@/types/auth';

export default function useUserService() {
  async function fetchCurrentUser() {
    try {
      const response = await fetcher('/api/user');

      return Promise.resolve(response);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  function fetchUsers() {
    //
  }

  function fetchUser() {
    //
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

  function deleteUser() {
    //
  }

  return {
    fetchCurrentUser,
    fetchUsers,
    fetchUser,
    updateUser,
    deleteUser
  };
}
