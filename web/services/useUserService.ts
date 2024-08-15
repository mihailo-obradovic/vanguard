export default function useUserService() {
  async function fetchCurrentUser() {
    try {
      const response = await fetcher('/api/user');

      return Promise.resolve(response);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  function updateCurrentUser() {
    //
  }

  function changePassword() {
    //
  }

  function fetchUsers() {
    //
  }

  function fetchUser() {
    //
  }

  function updateUser() {
    //
  }

  function deleteUser() {
    //
  }

  return {
    fetchCurrentUser,
    updateCurrentUser,
    changePassword,
    fetchUsers,
    fetchUser,
    updateUser,
    deleteUser
  };
}
