import { defineStore } from 'pinia';

import type { User, RegistrationForm, LoginForm } from '@/types/auth';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);

  const accessToken = useCookie('accessToken');

  const isLoggedIn = computed(() => !!accessToken.value);

  async function fetchUser() {
    try {
      const data = await fetcher('/api/user');

      user.value = data as User;
    } catch (error) {
      console.log(error);
    }
  }

  async function register(credentials: RegistrationForm) {
    try {
      await fetcher('/sanctum/csrf-cookie');

      const response = (await fetcher('/register', {
        method: 'POST',
        body: credentials
      })) as any;

      accessToken.value = response.access_token;

      await fetchUser();
    } catch (error) {
      console.log(error);
    }
  }

  async function logIn(credentials: LoginForm) {
    try {
      await fetcher('/sanctum/csrf-cookie');

      const response = (await fetcher('/login', {
        method: 'POST',
        body: credentials
      })) as any;

      accessToken.value = response.access_token;

      await fetchUser();
    } catch (error) {
      console.log(error);
    }
  }

  async function logOut() {
    try {
      await fetcher('/logout', { method: 'POST' });

      accessToken.value = null;

      user.value = null;
    } catch (error) {
      console.log(error);
    }
  }

  return { user, register, logIn, isLoggedIn, fetchUser, logOut };
});
