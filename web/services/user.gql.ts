import {
  UsersGqlResponseSchema,
  UpdateUserGqlResponseSchema
} from '@/types/user';

import type { User } from '@/types/auth';
import type { UpdateUserGqlInput } from '@/types/user';

// * The same two-layer contract REST follows (`user.api.ts`): pure async functions, no side
// * effects, and the response parsed at the service boundary so nothing untyped escapes.
// * Operations are named so they can be recognized in logs and request mocks.

const USERS = gql`
  query Users {
    users {
      id
      name
      email
      role
      email_verified_at
      created_at
      updated_at
    }
  }
`;

const UPDATE_USER = gql`
  mutation UpdateUser(
    $id: Int!
    $name: String
    $email: String
    $password: String
    $password_confirmation: String
    $role: String
  ) {
    updateUser(
      id: $id
      name: $name
      email: $email
      password: $password
      password_confirmation: $password_confirmation
      role: $role
    ) {
      id
      name
      email
      role
      email_verified_at
      created_at
      updated_at
    }
  }
`;

export async function fetchUsersGql(): Promise<User[]> {
  const response = await gqlFetcher(USERS);

  return parseResponse(UsersGqlResponseSchema, response).users;
}

export async function updateUserGql({
  id,
  ...userData
}: UpdateUserGqlInput): Promise<User> {
  const response = await gqlFetcher(UPDATE_USER, { id, ...userData });

  return parseResponse(UpdateUserGqlResponseSchema, response).updateUser;
}
