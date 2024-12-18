export type User = {
  id: number;
  name: string;
  email: string;
};

export type RegistrationInfo = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
};

export type Credentials = {
  email: string;
  password: string;
};
