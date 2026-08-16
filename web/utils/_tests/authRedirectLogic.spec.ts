import { describe, it, expect } from 'vitest';

import { determineAuthRedirect } from '../authRedirectLogic';

const GUEST = false;
const SIGNED_IN = true;

// * This branch has no guest auth pages — login, register and forgot-password are dialogs in the default layout — so /password-reset is the only guest-only route, and it carries its token in the query string rather than a path segment.
describe('determineAuthRedirect', () => {
  it('lets unauthenticated users reach the password-reset page', () => {
    expect(determineAuthRedirect('/password-reset', GUEST)).toEqual({
      shouldRedirect: false
    });
  });

  it('sends authenticated users away from the password-reset page', () => {
    const decision = determineAuthRedirect('/password-reset', SIGNED_IN);

    expect(decision.shouldRedirect).toBe(true);
    expect(decision.redirectTo).toBe('/home');
  });

  it('sends unauthenticated users away from protected pages', () => {
    const decision = determineAuthRedirect('/users', GUEST);

    expect(decision.shouldRedirect).toBe(true);
    expect(decision.redirectTo).toBe('/home');
  });

  it('lets unauthenticated users reach the shared home page', () => {
    expect(determineAuthRedirect('/home', GUEST)).toEqual({
      shouldRedirect: false
    });
  });

  it('ignores the query string when classifying a page', () => {
    const decision = determineAuthRedirect(
      '/password-reset?token=abc',
      SIGNED_IN
    );

    expect(decision.shouldRedirect).toBe(true);
    expect(decision.redirectTo).toBe('/home');
  });

  it('aliases the root path to home', () => {
    const decision = determineAuthRedirect('/', GUEST);

    expect(decision.shouldRedirect).toBe(true);
    expect(decision.redirectTo).toBe('/home');
  });

  // ! Signed in is the case that proves the alias exists. Signed out, `/` also lands on `/home` as a protected page under default-deny, so dropping the alias entirely would go unnoticed — on this branch both arms redirect to the same place.
  it('aliases the root path to home for signed-in users too', () => {
    const decision = determineAuthRedirect('/', SIGNED_IN);

    expect(decision.shouldRedirect).toBe(true);
    expect(decision.redirectTo).toBe('/home');
  });
});
