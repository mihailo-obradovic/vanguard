import type { UseFetchOptions } from 'nuxt/app';

export function useApiFetch<T>(
  path: string | (() => string),
  options: UseFetchOptions<T> = {}
) {
  let headers: any = {};

  const token = useCookie('XSRF-TOKEN');

  if (token.value) {
    headers['X-XSRF-TOKEN'] = token.value as string;
  }

  // TODO: Replace with a dynamic base URL variable
  return useFetch('http://localhost:8000' + path, {
    credentials: 'include',
    watch: false,
    ...options,
    headers: {
      ...headers,
      ...options?.headers
    }
  });
}
