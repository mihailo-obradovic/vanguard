import { describe, it, expect } from 'vitest';

import { determineAuthRedirect } from '../authRedirectLogic';

const GUEST = 'guest';
const SIGNED_IN = 'signed-in';

// * Login, register and forgot-password are dialogs in the default layout, not routes, so the
// * only guest-only route left is the still-tokenized /password-reset/{token} page — flattened
// * to a query-based /password-reset in Phase 3's next part.
describe('determineAuthRedirect', () => {
  it('lets unauthenticated users reach the tokenized password-reset page', () => {
    expect(determineAuthRedirect('/password-reset/abc123', GUEST)).toEqual({
      shouldRedirect: false
    });
  });

  it('sends authenticated users away from the password-reset page', () => {
    const decision = determineAuthRedirect('/password-reset/abc123', SIGNED_IN);

    expect(decision.shouldRedirect).toBe(true);
    expect(decision.redirectTo).toBe('/home');
  });

  it('sends unauthenticated users away from protected pages, to home', () => {
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
      '/password-reset/abc123?email=a@b.c',
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

  // ! Signed in is the case that proves the alias exists. Signed out, `/` also lands on `/home` as a protected page under default-deny, so dropping the alias entirely would go unnoticed — both arms redirect to the same place.
  it('aliases the root path to home for signed-in users too', () => {
    const decision = determineAuthRedirect('/', SIGNED_IN);

    expect(decision.shouldRedirect).toBe(true);
    expect(decision.redirectTo).toBe('/home');
  });
});
