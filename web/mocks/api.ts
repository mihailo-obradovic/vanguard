// * The origin the suite pretends the API lives at. Set by `vitest.config.ts` so the app's
// * `useRuntimeConfig().public.apiBaseUrl` and the handlers below always agree on it.
export const apiBaseUrl =
  process.env.NUXT_PUBLIC_API_BASE_URL ?? 'http://api.test';

/** Absolute URL for an API path, for use in MSW handler patterns. */
export function apiUrl(path: string): string {
  return apiBaseUrl + path;
}
