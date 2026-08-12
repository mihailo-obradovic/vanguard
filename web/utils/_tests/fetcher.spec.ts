// @vitest-environment nuxt
import { describe, it, expect, beforeEach } from 'vitest';
import { registerEndpoint } from '@nuxt/test-utils/runtime';
import { readBody } from 'h3';
import { FetchError } from 'ofetch';

import { fetcher } from '../fetcher';

import type { H3Event } from 'h3';
import type { FetcherOptions } from '../fetcher';

// * `$fetch` inside the Nuxt test environment is the harness's own instance, so a stub never
// * intercepts it. Driving real registered endpoints is also the better test: the assertions
// * describe what actually reached the server rather than restating the call arguments.
type RecordedRequest = {
  path: string;
  method: string;
  headers: Record<string, string | undefined>;
  body: unknown;
};

const requests: RecordedRequest[] = [];

// * How many more times /api/things answers 419. Set per test; the endpoint counts down, so
// * `1` reproduces a single expired token and `2` an expiry that survives the re-prime.
let expiredTokenResponses = 0;
let csrfCookieStatus = 200;

async function record(event: H3Event, path: string): Promise<RecordedRequest> {
  const request = {
    path,
    method: event.method,
    // * The harness forwards headers with their original casing; lower-casing here keeps the
    // * assertions from depending on how the fetcher happened to spell them.
    headers: Object.fromEntries(
      Object.entries(event.node.req.headers).map(([name, value]) => [
        name.toLowerCase(),
        String(value)
      ])
    ),
    body: await readBody(event).catch(() => undefined)
  };

  requests.push(request);

  return request;
}

registerEndpoint('/api/things', async (event) => {
  await record(event, '/api/things');

  if (expiredTokenResponses > 0) {
    expiredTokenResponses -= 1;
    event.node.res.statusCode = 419;

    return { message: 'CSRF token mismatch.' };
  }

  return { ok: true };
});

registerEndpoint('/api/broken', (event) => {
  event.node.res.statusCode = 500;

  return { message: 'Server error' };
});

registerEndpoint('/sanctum/csrf-cookie', async (event) => {
  await record(event, '/sanctum/csrf-cookie');

  if (csrfCookieStatus !== 200) {
    event.node.res.statusCode = csrfCookieStatus;

    return { message: 'CSRF token mismatch.' };
  }

  return '';
});

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

function trace() {
  return requests.map((request) => `${request.method} ${request.path}`);
}

describe('fetcher', () => {
  beforeEach(() => {
    requests.length = 0;
    expiredTokenResponses = 0;
    csrfCookieStatus = 200;
    setXsrfCookie('token-from-cookie');
  });

  it('asks for JSON on every request', async () => {
    await fetcher('/api/things');

    expect(requests[0]?.headers.accept).toBe('application/json');
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

    expect(requests).toHaveLength(methods.length);

    for (const request of requests) {
      expect(request.headers['x-xsrf-token']).toBe('token-from-cookie');
    }
  });

  it('omits the CSRF header on reads', async () => {
    await fetcher('/api/things');

    expect(requests[0]?.headers['x-xsrf-token']).toBeUndefined();
  });

  it('omits the CSRF header when no token cookie has been issued', async () => {
    setXsrfCookie(null);

    await fetcher('/api/things', { method: 'POST' });

    expect(requests[0]?.headers['x-xsrf-token']).toBeUndefined();
  });

  it('sends the caller method and body through unchanged', async () => {
    await fetcher('/api/things', { method: 'POST', body: { name: 'Mihailo' } });

    expect(requests[0]?.method).toBe('POST');
    expect(requests[0]?.body).toEqual({ name: 'Mihailo' });
  });

  it('keeps caller headers but never lets them displace its own', async () => {
    await fetcher('/api/things', {
      method: 'POST',
      headers: { 'X-Custom': 'kept', Accept: 'text/html' }
    });

    expect(requests[0]?.headers['x-custom']).toBe('kept');
    expect(requests[0]?.headers.accept).toBe('application/json');
  });

  it('returns the response body', async () => {
    await expect(fetcher('/api/things')).resolves.toEqual({ ok: true });
  });

  it('re-primes the CSRF cookie and retries once when the token has expired', async () => {
    expiredTokenResponses = 1;

    const result = await fetcher('/api/things', { method: 'PUT' });

    expect(result).toEqual({ ok: true });
    expect(trace()).toEqual([
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
    expect(trace()).toEqual([
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
    expect(trace()).toEqual(['GET /sanctum/csrf-cookie']);
  });

  it('lets any other failure through untouched', async () => {
    const error = await expectRejection(fetcher('/api/broken'));

    expect(error).toBeInstanceOf(FetchError);
    expect(error.statusCode).toBe(500);
  });
});
