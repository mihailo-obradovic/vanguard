import type { UseFetchOptions } from 'nuxt/app';

export function fetcher<T>(
  path: string | (() => string),
  options: UseFetchOptions<T> = {}
) {
  const { apiBaseUrl } = useRuntimeConfig().public;

  let headers: any = {};

  const token = useCookie('XSRF-TOKEN');

  if (token.value) {
    headers['X-XSRF-TOKEN'] = token.value as string;
  }

  if (import.meta.server) {
    headers = {
      ...headers,
      ...useRequestHeaders(['referer', 'cookie'])
    };
  }

  // TODO: Replace with a dynamic base URL variable
  return useFetch(apiBaseUrl + path, {
    credentials: 'include',
    watch: false,
    ...options,
    headers: {
      ...headers,
      ...options?.headers
    }
  });
}
