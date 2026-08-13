// @vitest-environment nuxt
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { FetchError } from 'ofetch';

import { server } from '@/mocks/server';
import { apiUrl } from '@/mocks/api';
import { recordRequests } from '@/mocks/requests';

import { fetcher } from '../fetcher';

import type { FetcherOptions } from '../fetcher';

const requests = recordRequests();

// * How many more times /api/things answers 419. Set per test; the handler counts down, so
// * `1` reproduces a single expired token and `2` an expiry that survives the re-prime.
let expiredTokenResponses = 0;
let csrfCookieStatus = 200;

function setXsrfCookie(value: string | null) {
  document.cookie =
    value === null
      ? 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      : `XSRF-TOKEN=${value}`;
}

async function expectRejection(promise: Promise<unknown>) {
  return promise.then(
    () => {
      throw new Error('Expected the request to reject.');
    },
    (error: unknown) => error as FetchError
  );
}

describe('fetcher', () => {
  beforeEach(() => {
    requests.reset();
    expiredTokenResponses = 0;
    csrfCookieStatus = 200;
    setXsrfCookie('token-from-cookie');

    server.use(
      http.all(apiUrl('/api/things'), () => {
        if (expiredTokenResponses > 0) {
          expiredTokenResponses -= 1;

          return HttpResponse.json(
            { message: 'CSRF token mismatch.' },
            { status: 419 }
          );
        }

        return HttpResponse.json({ ok: true });
      }),
      http.all(apiUrl('/api/broken'), () =>
        HttpResponse.json({ message: 'Server error' }, { status: 500 })
      ),
      http.all(apiUrl('/sanctum/csrf-cookie'), () => {
        if (csrfCookieStatus !== 200) {
          return HttpResponse.json(
            { message: 'CSRF token mismatch.' },
            { status: csrfCookieStatus }
          );
        }

        return new HttpResponse(null, { status: 204 });
      })
    );
  });

  it('asks for JSON on every request', async () => {
    await fetcher('/api/things');

    expect((await requests.at(0)).headers.accept).toBe('application/json');
  });

  it('attaches the CSRF header on requests that alter server state', async () => {
    const methods: FetcherOptions['method'][] = [
      'POST',
      'PUT',
      'PATCH',
      'DELETE'
    ];

    for (const method of methods) {
      await fetcher('/api/things', { method });
    }

    expect(requests.count()).toBe(methods.length);

    for (let index = 0; index < methods.length; index += 1) {
      expect((await requests.at(index)).headers['x-xsrf-token']).toBe(
        'token-from-cookie'
      );
    }
  });

  it('omits the CSRF header on reads', async () => {
    await fetcher('/api/things');

    expect((await requests.at(0)).headers['x-xsrf-token']).toBeUndefined();
  });

  it('omits the CSRF header when no token cookie has been issued', async () => {
    setXsrfCookie(null);

    await fetcher('/api/things', { method: 'POST' });

    expect((await requests.at(0)).headers['x-xsrf-token']).toBeUndefined();
  });

  it('sends the caller method and body through unchanged', async () => {
    await fetcher('/api/things', { method: 'POST', body: { name: 'Mihailo' } });

    const request = await requests.at(0);

    expect(request.method).toBe('POST');
    expect(request.body).toEqual({ name: 'Mihailo' });
  });

  it('keeps caller headers but never lets them displace its own', async () => {
    await fetcher('/api/things', {
      method: 'POST',
      headers: { 'X-Custom': 'kept', Accept: 'text/html' }
    });

    const request = await requests.at(0);

    expect(request.headers['x-custom']).toBe('kept');
    expect(request.headers.accept).toBe('application/json');
  });

  it('returns the response body', async () => {
    await expect(fetcher('/api/things')).resolves.toEqual({ ok: true });
  });

  it('re-primes the CSRF cookie and retries once when the token has expired', async () => {
    expiredTokenResponses = 1;

    const result = await fetcher('/api/things', { method: 'PUT' });

    expect(result).toEqual({ ok: true });
    expect(requests.trace()).toEqual([
      'PUT /api/things',
      'GET /sanctum/csrf-cookie',
      'PUT /api/things'
    ]);
  });

  it('retries exactly once and surfaces a second expiry to the caller', async () => {
    expiredTokenResponses = 2;

    const error = await expectRejection(
      fetcher('/api/things', { method: 'POST' })
    );

    expect(error.statusCode).toBe(419);
    // * Two attempts and a single re-prime — the recovery never loops.
    expect(requests.trace()).toEqual([
      'POST /api/things',
      'GET /sanctum/csrf-cookie',
      'POST /api/things'
    ]);
  });

  it('does not try to recover a 419 raised by the CSRF endpoint itself', async () => {
    csrfCookieStatus = 419;

    const error = await expectRejection(fetcher('/sanctum/csrf-cookie'));

    expect(error.statusCode).toBe(419);
    // * One call only — re-priming the re-prime would recurse.
    expect(requests.trace()).toEqual(['GET /sanctum/csrf-cookie']);
  });

  it('lets any other failure through untouched', async () => {
    const error = await expectRejection(fetcher('/api/broken'));

    expect(error).toBeInstanceOf(FetchError);
    expect(error.statusCode).toBe(500);
  });
});
