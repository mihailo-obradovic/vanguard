import type { User, RegistrationInfo, Credentials } from '@/types/types';

export default function useAuthService() {
  const { user } = storeToRefs(useAuthStore());

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

  return { register, logIn, fetchUser, logOut };
}
