import { UserSchema } from '@/types/auth';

import type { User } from '@/types/auth';

/**
 * A user shaped like `UserResource` sends it.
 *
 * ! Parsed through `UserSchema` on the way out, so a fixture that drifts from the contract the
 * ! services validate against fails here instead of quietly satisfying a spec that mocks it.
 */
export function buildUser(overrides: Partial<User> = {}): User {
  return UserSchema.parse({
    id: 1,
    name: 'Mihailo',
    email: 'mihailo@example.com',
    role: 'user',
    email_verified_at: null,
    created_at: '2026-08-01T00:00:00.000000Z',
    updated_at: '2026-08-01T00:00:00.000000Z',
    ...overrides
  });
}
