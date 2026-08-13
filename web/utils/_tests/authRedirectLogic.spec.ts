// @vitest-environment nuxt
import { describe, it, expect } from 'vitest';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { ref } from 'vue';

import { determineAuthRedirect } from '../authRedirectLogic';

const isLoggedIn = ref(false);

mockNuxtImport('useAuthStore', () => () => ({ isLoggedIn }));
mockNuxtImport('storeToRefs', () => (store: unknown) => store);

// * This branch has no guest auth pages — login, register and forgot-password are dialogs in the
// * default layout — so /password-reset is the only guest-only route, and it carries its token in
// * the query string rather than a path segment.
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

  it('sends unauthenticated users away from protected pages', () => {
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

  // ! Signed in is the case that proves the alias exists. Signed out, `/` also lands on `/home` as
  // ! a protected page under default-deny, so dropping the alias entirely would go unnoticed —
  // ! on this branch both arms redirect to the same place.
  it('aliases the root path to home for signed-in users too', () => {
    isLoggedIn.value = true;

    const decision = determineAuthRedirect('/', {});

    expect(decision.shouldRedirect).toBe(true);
    expect(decision.redirectTo).toBe('/home');
  });
});
