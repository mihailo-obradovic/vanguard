// @vitest-environment nuxt
import { describe, it, expect } from 'vitest';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { ref } from 'vue';

import { determineAuthRedirect } from './authRedirectLogic';

const isLoggedIn = ref(false);

mockNuxtImport('useAuthStore', () => () => ({ isLoggedIn }));
mockNuxtImport('storeToRefs', () => (store: unknown) => store);

describe('determineAuthRedirect', () => {
  it('lets unauthenticated users reach the auth pages', () => {
    isLoggedIn.value = false;

    for (const path of ['/login', '/register', '/forgot-password']) {
      expect(determineAuthRedirect(path, {})).toEqual({
        shouldRedirect: false
      });
    }
  });

  it('lets unauthenticated users reach the tokenized password-reset page', () => {
    isLoggedIn.value = false;

    expect(
      determineAuthRedirect('/password-reset/abc123', { email: 'a@b.c' })
    ).toEqual({ shouldRedirect: false });
  });

  it('sends authenticated users away from guest-only pages', () => {
    isLoggedIn.value = true;

    const decision = determineAuthRedirect('/login', {});

    expect(decision.shouldRedirect).toBe(true);
    expect(decision.redirectTo).toBe('/home');
  });

  it('redirects unauthenticated users from protected pages to login', () => {
    isLoggedIn.value = false;

    const decision = determineAuthRedirect('/users', {});

    expect(decision.shouldRedirect).toBe(true);
    expect(decision.redirectTo).toBe('/login');
  });

  it('aliases the root path to home', () => {
    isLoggedIn.value = false;

    const decision = determineAuthRedirect('/', {});

    expect(decision.shouldRedirect).toBe(true);
    expect(decision.redirectTo).toBe('/home');
  });
});
