import type { FetchError } from 'ofetch';

// Extracts Laravel's 422 payload ({ errors: { field: [messages] } }) as a
// field-keyed map, matching the shape Regle expects for external errors.
export function getValidationErrors(
  error: FetchError
): Record<string, string[]> {
  const errors: unknown = error.data?.errors;

  if (!errors || typeof errors !== 'object') {
    return {};
  }

  return Object.fromEntries(
    Object.entries(errors).flatMap(([field, messages]) => {
      const fieldMessages = (Array.isArray(messages) ? messages : []).filter(
        (message): message is string => typeof message === 'string'
      );

      return fieldMessages.length > 0 ? [[field, fieldMessages]] : [];
    })
  );
}
