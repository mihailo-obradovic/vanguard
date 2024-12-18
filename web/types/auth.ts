export type Credentials = {
  email: string;
  password: string;
};

export type User = Credentials & {
  id: number;
};

export type RegistrationForm = Credentials & {
  name: string;
  password_confirmation: string;
};

export type PasswordResetForm = Credentials & {
  token: string;
};
