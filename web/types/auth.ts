export type Credentials = {
  email: string;
  password: string;
};

export type User = {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
};

export type RegistrationForm = Credentials & {
  name: string;
  password_confirmation: string;
};

export type PasswordResetForm = Credentials & {
  token: string;
};
