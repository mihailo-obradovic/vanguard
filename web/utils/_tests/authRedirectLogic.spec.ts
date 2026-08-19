// @vitest-environment nuxt
import { describe, it, expect } from 'vitest';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { ref } from 'vue';

import { determineAuthRedirect } from '../authRedirectLogic';

const isLoggedIn = ref(false);

mockNuxtImport('useAuthStore', () => () => ({ isLoggedIn }));
mockNuxtImport('storeToRefs', () => (store: unknown) => store);

describe('determineAuthRedirect', () => {
  it('lets unauthenticated users reach the password-reset page from its emailed link', () => {
    isLoggedIn.value = false;

    expect(
      determineAuthRedirect('/password-reset', {
        token: 'abc123',
        email: 'a@b.c'
      })
    ).toEqual({ shouldRedirect: false });
  });

  it('sends authenticated users away from the password-reset page', () => {
    isLoggedIn.value = true;

    const decision = determineAuthRedirect('/password-reset', {});

    expect(decision.shouldRedirect).toBe(true);
    expect(decision.redirectTo).toBe('/home');
  });

  // * There is no login route to send them to — the layout opens the dialog instead.
  it('redirects unauthenticated users from protected pages to home', () => {
    isLoggedIn.value = false;

    const decision = determineAuthRedirect('/users', {});

    expect(decision.shouldRedirect).toBe(true);
    expect(decision.redirectTo).toBe('/home');
  });

  it('lets unauthenticated users reach the shared home page', () => {
    isLoggedIn.value = false;

    expect(determineAuthRedirect('/home', {})).toEqual({
      shouldRedirect: false
    });
  });

  it('ignores the query string when classifying a page', () => {
    isLoggedIn.value = true;

    const decision = determineAuthRedirect('/password-reset?token=abc', {});

    expect(decision.shouldRedirect).toBe(true);
    expect(decision.redirectTo).toBe('/home');
  });

  it('aliases the root path to home', () => {
    isLoggedIn.value = false;

    const decision = determineAuthRedirect('/', {});

    expect(decision.shouldRedirect).toBe(true);
    expect(decision.redirectTo).toBe('/home');
  });
});
