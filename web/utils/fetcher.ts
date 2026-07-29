export function fetcher<T>(path: string, params: any = {}): Promise<T> {
  const { apiBaseUrl } = useRuntimeConfig().public;

  const headers: any = { Accept: 'application/json' };
  const options: any = { ...params };

  const isAlteringServerState = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
    String(params?.method).toUpperCase()
  );

  // Send the session cookie and CSRF token for stateful (SPA) requests.
  if (!params?.method || isAlteringServerState) {
    const token = useCookie('XSRF-TOKEN');

    headers['X-XSRF-TOKEN'] = token.value;
    options.credentials = 'include';
  }

  options.headers = {
    ...params.headers,
    ...headers
  };

  return $fetch<T>(apiBaseUrl + path, options);
}
