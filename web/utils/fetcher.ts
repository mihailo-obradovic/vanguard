import { FetchError } from 'ofetch';
import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack/types';

export type FetcherOptions = Omit<
  NitroFetchOptions<NitroFetchRequest>,
  'headers'
> & {
  headers?: Record<string, string>;
};

const CSRF_COOKIE_PATH = '/sanctum/csrf-cookie';

export async function fetcher<T>(
  path: string,
  params: FetcherOptions = {}
): Promise<T> {
  try {
    return await makeRequest<T>(path, params);
  } catch (error) {
    // * An expired CSRF token (419) is recoverable: refresh the cookie and retry the request once with the new token.
    if (
      error instanceof FetchError &&
      error.statusCode === 419 &&
      path !== CSRF_COOKIE_PATH
    ) {
      await makeRequest(CSRF_COOKIE_PATH, {});

      return makeRequest<T>(path, params);
    }

    throw error;
  }
}

function makeRequest<T>(path: string, params: FetcherOptions): Promise<T> {
  const { apiBaseUrl } = useRuntimeConfig().public;

  const headers: Record<string, string> = { Accept: 'application/json' };
  // * Always send the session cookie for stateful (SPA) requests.
  const options: FetcherOptions = { ...params, credentials: 'include' };

  const isAlteringServerState = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
    String(params.method).toUpperCase()
  );

  if (isAlteringServerState) {
    const token = useCookie('XSRF-TOKEN');

    if (token.value) {
      headers['X-XSRF-TOKEN'] = token.value;
    }
  }

  options.headers = {
    ...params.headers,
    ...headers
  };

  return $fetch<T>(apiBaseUrl + path, options);
}
