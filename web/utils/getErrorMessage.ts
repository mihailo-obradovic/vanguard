// * Extracts the most useful, human-readable message from a failed request.
// * ofetch (Nuxt's $fetch) throws a FetchError whose `.message` is a generic string like `[POST] "/login": 422 Unprocessable Content`, while the API's own message — e.g. Laravel's "These credentials do not match our records." — lives on the parsed body at `.data.message`, so that one comes first and the generic one is only the fallback.
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
