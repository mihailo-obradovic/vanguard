// @vitest-environment nuxt
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { createPinia, setActivePinia } from 'pinia';

import { server } from '@/mocks/server';
import { apiUrl } from '@/mocks/api';
import { recordRequests } from '@/mocks/requests';
import { buildUser } from '@/mocks/fixtures';
import { authHandlers } from '@/mocks/handlers/auth';
import { useAuthStore } from '@/stores/useAuthStore';

import authLoader from '../auth-loader';

const requests = recordRequests();

const user = buildUser();

// * The object form of `defineNuxtPlugin` returns its `setup` with the object's own keys assigned,
// * so the default export is callable. The plugin reads nothing off `nuxtApp`.
const boot = authLoader as unknown as () => Promise<void>;

describe('the auth-loader plugin', () => {
  beforeEach(() => {
    requests.reset();
    setActivePinia(createPinia());
    server.use(...authHandlers(user));
  });

  // ! The contract is that priming *completes* first, not merely that it is sent first: Sanctum
  // ! rejects a session request made without the XSRF cookie, so a `/api/user` call that races the
  // ! priming one signs a returning user out on every refresh. Holding the priming response open
  // ! is what distinguishes the two — with both requests left to run freely they leave in order
  // ! either way, and dropping the `await` goes unnoticed.
  it('waits for the CSRF cookie before it reads the session', async () => {
    let primeCookie = () => {};
    const primed = new Promise<void>((resolve) => {
      primeCookie = resolve;
    });

    server.use(
      http.get(apiUrl('/sanctum/csrf-cookie'), async () => {
        await primed;

        return new HttpResponse(null, { status: 204 });
      })
    );

    const booting = boot();

    await requests.settle();

    expect(requests.trace()).toEqual(['GET /sanctum/csrf-cookie']);

    primeCookie();
    await booting;

    expect(requests.trace()).toEqual([
      'GET /sanctum/csrf-cookie',
      'GET /api/user'
    ]);
  });

  it('restores the signed-in user from the session cookie', async () => {
    await boot();

    const store = useAuthStore();

    expect(store.user).toEqual(user);
    expect(store.isLoggedIn).toBe(true);
  });

  it('leaves nobody signed in when the session has expired', async () => {
    server.use(
      http.get(
        apiUrl('/api/user'),
        () => new HttpResponse(null, { status: 401 })
      )
    );

    await expect(boot()).resolves.toBeUndefined();

    expect(useAuthStore().isLoggedIn).toBe(false);
  });

  // * A response that does not match the schema is the same failure as no session at all — the
  // * app must not boot holding a half-parsed user.
  it('leaves nobody signed in when the user does not match the schema', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    server.use(
      http.get(apiUrl('/api/user'), () =>
        HttpResponse.json({ data: { ...user, role: 'superuser' } })
      )
    );

    await boot();

    expect(useAuthStore().isLoggedIn).toBe(false);
  });

  // ! Priming sits outside the try on purpose: without the cookie every later write would 419,
  // ! so the plugin fails the boot rather than starting the app in a state where nothing saves.
  it('fails the boot when the CSRF cookie cannot be primed', async () => {
    server.use(
      http.get(
        apiUrl('/sanctum/csrf-cookie'),
        () => new HttpResponse(null, { status: 500 })
      )
    );

    await expect(boot()).rejects.toBeInstanceOf(Error);

    // * Asserted as an absence rather than an exact trace: ofetch retries an idempotent request
    // * on a 5xx of its own accord, so the priming call legitimately appears more than once.
    expect(requests.trace()).not.toContain('GET /api/user');
    expect(useAuthStore().isLoggedIn).toBe(false);
  });
});
