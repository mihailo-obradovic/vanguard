export default function useUserService() {
  function fetchCurrentUser() {
    return new Promise<void>((resolve, reject) => {
      fetcher('/api/user')
        .then((response: any) => {
          resolve(response);
        })
        .catch((error) => {
          reject(error);
        });
    });
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
