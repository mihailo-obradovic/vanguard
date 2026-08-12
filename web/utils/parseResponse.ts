import type { ZodType } from 'zod';

// * Validates a server success-response against its schema. A mismatch means the backend contract changed: surface the details in the console and throw a user-presentable error for the centralized toast handling.
export function parseResponse<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    console.error('Unexpected API response shape:', result.error);

    // * Resolved per call, never at module scope — the Nuxt app does not exist at import time.
    throw new Error(useNuxtApp().$i18n.t('errors.unexpectedResponse'));
  }

  return result.data;
}
