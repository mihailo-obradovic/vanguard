import { z } from 'zod';

import { UserSchema } from '@/types/auth';

export const UsersResponseSchema = z.object({
  data: z.array(UserSchema),
  total: z.number()
});

export type UsersResponse = z.infer<typeof UsersResponseSchema>;

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
