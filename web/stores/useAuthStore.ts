import { defineStore } from 'pinia';
import type { User, RegistrationForm, LoginForm } from '@/types/auth';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);

  const isLoggedIn = computed(() => !!user.value);

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

      await fetcher('/register', {
        method: 'POST',
        body: credentials
      });

      await fetchUser();
    } catch (error) {
      console.log(error);
    }
  }

  async function logIn(credentials: LoginForm) {
    try {
      await fetcher('/sanctum/csrf-cookie');

      await fetcher('/login', {
        method: 'POST',
        body: credentials
      });

      await fetchUser();
    } catch (error) {
      console.log(error);
    }
  }

  async function logOut() {
    try {
      await fetcher('/logout', { method: 'POST' });

      user.value = null;
    } catch (error) {
      console.log(error);
    }
  }

  return { user, register, logIn, isLoggedIn, fetchUser, logOut };
});
