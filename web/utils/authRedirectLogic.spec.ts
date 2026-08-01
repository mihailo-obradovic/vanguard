// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { ref } from 'vue';

import { determineAuthRedirect } from './authRedirectLogic';

const isLoggedIn = ref(false);

mockNuxtImport('useAuthStore', () => () => ({ isLoggedIn }));
mockNuxtImport('storeToRefs', () => (store: unknown) => store);

describe('determineAuthRedirect', () => {
  it('lets unauthenticated users reach the password-reset page', () => {
    isLoggedIn.value = false;

    expect(
      determineAuthRedirect('/password-reset', { token: 'abc', email: 'a@b.c' })
    ).toEqual({ shouldRedirect: false });
  });

  it('sends authenticated users away from the password-reset page', () => {
    isLoggedIn.value = true;

    const decision = determineAuthRedirect('/password-reset', {});

    expect(decision.shouldRedirect).toBe(true);
    expect(decision.redirectTo).toBe('/home');
  });

  it('still redirects unauthenticated users away from protected pages', () => {
    isLoggedIn.value = false;

    const decision = determineAuthRedirect('/users', {});

    expect(decision.shouldRedirect).toBe(true);
    expect(decision.redirectTo).toBe('/home');
  });
});
