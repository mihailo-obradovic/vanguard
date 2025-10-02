import type {
  RegistrationForm,
  Credentials,
  PasswordResetForm,
  User,
  Token
} from '@/types/auth';

// TODO: Move store imports out of the service

export async function register(credentials: RegistrationForm) {
  const { setUser, setAccessToken } = useAuthStore();

  const response = await fetcher<Token>('/register', {
    method: 'POST',
    body: credentials
  });

  setAccessToken(response.access_token);

  const userResponse = await fetchCurrentUser();

  setUser(userResponse);
}

export async function logIn(credentials: Credentials) {
  const { setUser, setAccessToken } = useAuthStore();

  await fetcher('/sanctum/csrf-cookie');

  const response = await fetcher<Token>('/login', {
    method: 'POST',
    body: credentials
  });

  setAccessToken(response.access_token);

  const userResponse = await fetchCurrentUser();

  setUser(userResponse);
}

export async function fetchCurrentUser() {
  const { setUser } = useAuthStore();

  const response = await fetcher<User>('/api/user');

  setUser(response);

  return response;
}

export async function logOut() {
  const { resetUser } = useAuthStore();

  await fetcher('/logout', { method: 'POST' });

  resetUser();
}

export async function generatePasswordResetEmail(form: { email: string }) {
  await fetcher('/forgot-password', {
    method: 'POST',
    body: form
  });
}

export async function resetPassword(form: PasswordResetForm) {
  await fetcher('/reset-password', {
    method: 'POST',
    body: form
  });
}
