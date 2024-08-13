export type User = {
  id: number;
  name: string;
  email: string;
};

export type RegistrationForm = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
};

export type LoginForm = {
  email: string;
  password: string;
};
