import { z } from 'zod';

import { UserSchema } from '@/types/auth';

export const UsersResponseSchema = z.object({
  data: z.array(UserSchema),
  total: z.number()
});

export type UsersResponse = z.infer<typeof UsersResponseSchema>;

// * GraphQL returns the same user objects as REST — both transports serialize through
// * UserResource — so these schemas wrap the shared UserSchema rather than redeclaring it.
export const UsersGqlResponseSchema = z.object({
  users: z.array(UserSchema)
});

export const UpdateUserGqlResponseSchema = z.object({
  updateUser: UserSchema
});

export type UpdateUserGqlInput = {
  id: number;
} & UpdateUserForm;

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
