import type { ZodType } from 'zod';

// Validates a server success-response against its schema. A mismatch means
// the backend contract changed: surface the details in the console and throw
// a user-presentable error for the centralized toast handling.
export function parseResponse<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    console.error('Unexpected API response shape:', result.error);

    throw new Error('Unexpected response from the server.');
  }

  return result.data;
}
