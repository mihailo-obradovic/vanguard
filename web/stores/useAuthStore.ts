import { defineStore } from 'pinia';

type User = {
  id: number;
  name: string;
  email: string;
};

type RegistrationInfo = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
};

type Credentials = {
  email: string;
  password: string;
};

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);

  const isLoggedIn = computed(() => !!user.value);

  async function fetchUser() {
    const { data, error } = await fetcher('/api/user');

    if (error.value) {
      // console.log(error);

      return;
    }

    user.value = data.value as User;
  }

  async function register(info: RegistrationInfo) {
    await fetcher('/sanctum/csrf-cookie');

    const register = await fetcher('/register', {
      method: 'POST',
      body: info
    });

    await fetchUser();

    return register;
  }

  async function logIn(credentials: Credentials) {
    await fetcher('/sanctum/csrf-cookie');

    const login = await fetcher('/login', {
      method: 'POST',
      body: credentials
    });

    await fetchUser();

    return login;
  }

  async function logOut() {
    await fetcher('/logout', { method: 'POST' });

    user.value = null;

    navigateTo('/login');
  }

  return { user, register, logIn, isLoggedIn, fetchUser, logOut };
});
