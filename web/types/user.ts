import type { User } from '@/types/auth';

export type UsersResponse = {
  data: User[];
  total: number;
};

export type CreateUserForm = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role?: 'user' | 'admin';
};

export type UpdateUserForm = Partial<CreateUserForm> & {
  current_password?: string;
};

export type ProfileForm = {
  name: string;
  email: string;
  current_password: string;
  password?: string;
  password_confirmation?: string;
};
