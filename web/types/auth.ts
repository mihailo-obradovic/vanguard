import { z } from 'zod';

export type Credentials = {
  email: string;
  password: string;
};

export const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  role: z.enum(['user', 'admin']),
  email_verified_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string()
});

// * Laravel API resources wrap single models in a `data` envelope.
export const UserEnvelopeSchema = z.object({ data: UserSchema });

export type User = z.infer<typeof UserSchema>;

export type RegistrationForm = Credentials & {
  name: string;
  password_confirmation: string;
};

export type PasswordResetForm = Credentials & {
  token: string;
  password_confirmation: string;
};
