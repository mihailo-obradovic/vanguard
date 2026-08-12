/**
 * Extract the most useful, human-readable message from a failed request.
 *
 * ofetch (Nuxt's $fetch) throws a FetchError whose `.message` is a generic
 * string like `[POST] "/login": 422 Unprocessable Content`. The API's actual
 * message — e.g. Laravel's "These credentials do not match our records." —
 * lives on the parsed response body at `.data.message`, so prefer that and
 * only fall back when it is absent.
 */
export function getErrorMessage(error: unknown): string {
  const data = (error as { data?: { message?: unknown } })?.data;

  if (typeof data?.message === 'string' && data.message.trim() !== '') {
    return data.message;
  }

  const message = (error as { message?: unknown })?.message;

  if (typeof message === 'string' && message.trim() !== '') {
    return message;
  }

  // * Resolved per call, never at module scope — the Nuxt app does not exist at import time.
  return useNuxtApp().$i18n.t('errors.generic');
}
