import { defineStore } from 'pinia';
import type { User, RegistrationForm, LoginForm } from '@/types/auth';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);

  const isLoggedIn = computed(() => !!user.value);

  function fetchUser() {
    return fetcher('/api/user')
      .then((data) => {
        user.value = data as User;
      })
      .catch((error) => {
        console.log(error);
      });
  }

  function register(credentials: RegistrationForm) {
    return fetcher('/sanctum/csrf-cookie')
      .then(() => {
        return fetcher('/register', {
          method: 'POST',
          body: credentials
        });
      })
      .then(() => {
        return fetchUser();
      })
      .catch((error) => {
        console.log(error);
      });
  }

  function logIn(credentials: LoginForm) {
    return fetcher('/sanctum/csrf-cookie')
      .then(() => {
        return fetcher('/login', {
          method: 'POST',
          body: credentials
        });
      })
      .then(() => {
        return fetchUser();
      })
      .catch((error) => {
        console.log(error);
      });
  }

  function logOut() {
    return fetcher('/logout', { method: 'POST' })
      .then(() => {
        user.value = null;
      })
      .catch((error) => {
        console.log(error);
      });
  }

  return { user, register, logIn, isLoggedIn, fetchUser, logOut };
});
