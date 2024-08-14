export function fetcher(path: string, params: any = {}) {
  const { apiBaseUrl } = useRuntimeConfig().public;

  const headers: any = {};
  const options: any = { ...params };

  const altersServerState = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
    String(params?.method).toUpperCase()
  );

  if (!params?.method || altersServerState) {
    const token = useCookie('XSRF-TOKEN');

    if (token) {
      headers['X-XSRF-TOKEN'] = token.value;
      options.credentials = 'include';
    }
  }

  options.headers = {
    ...params.headers,
    ...headers
  };

  return $fetch(apiBaseUrl + path, options);
}
