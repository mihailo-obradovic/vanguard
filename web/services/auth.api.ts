import type {
  RegistrationForm,
  Credentials,
  PasswordResetForm,
  User
} from '@/types/auth';

export async function register(credentials: RegistrationForm) {
  await fetcher('/register', {
    method: 'POST',
    body: credentials
  });

  await fetchCurrentUser();
}

export async function logIn(credentials: Credentials) {
  await fetcher('/login', {
    method: 'POST',
    body: credentials
  });

  await fetchCurrentUser();
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
