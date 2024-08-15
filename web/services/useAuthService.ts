import useUserService from '@/services/useUserService';

import type { RegistrationForm, LoginForm } from '@/types/auth';

export default function useAuthService() {
  const { fetchCurrentUser } = useUserService();

  const { accessToken, user } = storeToRefs(useAuthStore());

  function register(credentials: RegistrationForm) {
    return new Promise<void>((resolve, reject) => {
      fetcher('/register', {
        method: 'POST',
        body: credentials
      })
        .then((response: any) => {
          accessToken.value = response.access_token;

          fetchCurrentUser()
            .then((response: any) => {
              user.value = response;

              resolve();
            })
            .catch((error) => {
              reject(error);
            });
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  function logIn(credentials: LoginForm) {
    return new Promise<void>((resolve, reject) => {
      fetcher('/sanctum/csrf-cookie')
        .then(() => {
          fetcher('/login', {
            method: 'POST',
            body: credentials
          })
            .then((response: any) => {
              accessToken.value = response.access_token;

              fetchCurrentUser()
                .then((response: any) => {
                  user.value = response;

                  resolve();
                })
                .catch((error) => {
                  reject(error);
                });
            })
            .catch((error) => {
              reject(error);
            });
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  function logOut() {
    return new Promise<void>((resolve, reject) => {
      fetcher('/logout', { method: 'POST' })
        .then(() => {
          accessToken.value = null;

          user.value = null;

          resolve();
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  function resetPassword() {
    //
  }

  return { register, logIn, logOut, resetPassword };
}
