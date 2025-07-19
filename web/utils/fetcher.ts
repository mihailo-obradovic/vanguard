export function fetcher(path: string, params: any = {}) {
  const { apiBaseUrl } = useRuntimeConfig().public;

  const { accessToken } = storeToRefs(useAuthStore());

  const headers: any = {};
  const options: any = { ...params };

  const isAlteringServerState = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
    String(params?.method).toUpperCase()
  );

  // TODO: Check when to send the XSRF token
  if (!params?.method || isAlteringServerState) {
    const token = useCookie('XSRF-TOKEN');

    // if (!token) {
    //   return handleError()
    // }

    headers['X-XSRF-TOKEN'] = token.value;
    options.credentials = 'include';
  }

  if (accessToken.value) {
    headers['Authorization'] = `Bearer ${accessToken.value}`;
  }

  options.headers = {
    ...params.headers,
    ...headers
  };

  return $fetch(apiBaseUrl + path, options);
}

// Idea: Use a CSRF token for guest methods
// Idea: Use an access token for user methods
// Idea: Use a refresh token for refreshing the access token
// const routeRequiresAccessToken...
// const routeRequiresRefreshToken...
// if (routeRequiresAccessToken) {
//   if (!accessToken){
//     handleError()...
//   }
//   headers['Authorization'] = `Bearer ${accessToken}`
// } else if (routeRequiresCsrfToken) {
//   if (!csrfToken){
//     handleError()...
//   }
//   headers['X-CSRF-TOKEN'] = csrfToken
//   options.credentials = 'include'
// }
