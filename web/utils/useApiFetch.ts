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

  if (import.meta.server) {
    headers = {
      ...headers,
      ...useRequestHeaders(['referer', 'cookie'])
    };
  }

  const { apiBaseUrl } = useRuntimeConfig().public;

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
