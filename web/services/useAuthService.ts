import useUserService from '@/services/useUserService';

import type {
  RegistrationForm,
  Credentials,
  PasswordResetForm
} from '@/types/auth';

export default function useAuthService() {
  const { fetchCurrentUser } = useUserService();

  const { accessToken, user } = storeToRefs(useAuthStore());

  // getCsrfToken

  async function register(credentials: RegistrationForm) {
    try {
      const response: any = await fetcher('/register', {
        method: 'POST',
        body: credentials
      });

      accessToken.value = response.access_token;

      const userResponse: any = await fetchCurrentUser();

      user.value = userResponse;

      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async function logIn(credentials: Credentials) {
    try {
      await fetcher('/sanctum/csrf-cookie');

      const response: any = await fetcher('/login', {
        method: 'POST',
        body: credentials
      });

      accessToken.value = response.access_token;

      const userResponse: any = await fetchCurrentUser();

      user.value = userResponse;

      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // refreshTokens

  async function logOut() {
    try {
      await fetcher('/logout', { method: 'POST' });

      accessToken.value = null;
      user.value = null;

      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async function generatePasswordResetEmail(form: { email: string }) {
    try {
      await fetcher('/forgot-password', {
        method: 'POST',
        body: form
      });

      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // checkResetToken

  async function resetPassword(form: PasswordResetForm) {
    try {
      await fetcher('/reset-password', {
        method: 'POST',
        body: form
      });

      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }

  return { register, logIn, logOut, generatePasswordResetEmail, resetPassword };
}
