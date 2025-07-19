import type {
  RegistrationForm,
  Credentials,
  PasswordResetForm
} from '@/types/auth';

// TODO: Move store imports out of the service

export async function register(credentials: RegistrationForm) {
  const { accessToken, user } = storeToRefs(useAuthStore());

  const response: any = await fetcher('/register', {
    method: 'POST',
    body: credentials
  });

  accessToken.value = response.access_token;

  const userResponse: any = await fetchCurrentUser();

  user.value = userResponse;

  return Promise.resolve();
}

export async function logIn(credentials: Credentials) {
  const { accessToken, user } = storeToRefs(useAuthStore());

  await fetcher('/sanctum/csrf-cookie');

  const response: any = await fetcher('/login', {
    method: 'POST',
    body: credentials
  });

  accessToken.value = response.access_token;

  const userResponse: any = await fetchCurrentUser();

  user.value = userResponse;

  return Promise.resolve();
}

export async function fetchCurrentUser() {
  const { user } = storeToRefs(useAuthStore());

  const response: any = await fetcher('/api/user');

  user.value = response;

  return Promise.resolve(response);
}

export async function logOut() {
  const { accessToken, user } = storeToRefs(useAuthStore());

  await fetcher('/logout', { method: 'POST' });

  accessToken.value = null;
  user.value = null;

  return Promise.resolve();
}

export async function generatePasswordResetEmail(form: { email: string }) {
  await fetcher('/forgot-password', {
    method: 'POST',
    body: form
  });

  return Promise.resolve();
}

export async function resetPassword(form: PasswordResetForm) {
  await fetcher('/reset-password', {
    method: 'POST',
    body: form
  });

  return Promise.resolve();
}
