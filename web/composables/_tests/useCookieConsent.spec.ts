// @vitest-environment nuxt
import { describe, it, expect, beforeEach } from 'vitest';

import { useCookieConsent } from '../useCookieConsent';

/**
 * Arrive as a first-time visitor — no consent cookie at all.
 *
 * ! Both details are load-bearing. Writing `null` through the composable instead would leave the
 * ! cookie in place with an empty value, which reads back as a decision rather than the absence of
 * ! one; and without `path=/` the expiry silently does nothing, leaving the previous test's answer
 * ! in place while this one still passes for the wrong reason.
 */
function arriveWithoutADecision() {
  document.cookie =
    'cookie_consent=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

/**
 * Wait for the cookie to actually be written.
 *
 * ! `useCookie` flushes to `document.cookie` on a macrotask, so `nextTick` returns too early and a
 * ! caller created straight after a decision still reads the old value.
 */
function settleTheCookie() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('useCookieConsent', () => {
  beforeEach(() => {
    arriveWithoutADecision();
  });

  it('treats a first-time visitor as undecided', () => {
    const { isDecided, hasConsented } = useCookieConsent();

    expect(isDecided.value).toBe(false);
    expect(hasConsented.value).toBe(false);
  });

  it('records consent when the visitor accepts', () => {
    const { accept, isDecided, hasConsented } = useCookieConsent();

    accept();

    expect(isDecided.value).toBe(true);
    expect(hasConsented.value).toBe(true);
  });

  // ! Declining is a decision too — the banner must stop asking, which is why `isDecided` is
  // ! separate from `hasConsented` rather than derived from it.
  it('settles the question when the visitor declines, without consenting', () => {
    const { decline, isDecided, hasConsented } = useCookieConsent();

    decline();

    expect(isDecided.value).toBe(true);
    expect(hasConsented.value).toBe(false);
  });

  it('lets a visitor who accepted change their mind', () => {
    const { accept, decline, hasConsented } = useCookieConsent();

    accept();
    decline();

    expect(hasConsented.value).toBe(false);
  });

  // * The decision outlives the caller that made it: it is a cookie, not component state, so the
  // * banner does not come back on the next page the visitor opens.
  it('keeps the decision for the next caller', async () => {
    useCookieConsent().accept();

    await settleTheCookie();

    expect(useCookieConsent().hasConsented.value).toBe(true);
  });

  it('keeps a declined decision the same way', async () => {
    useCookieConsent().decline();

    await settleTheCookie();

    const { isDecided, hasConsented } = useCookieConsent();

    expect(isDecided.value).toBe(true);
    expect(hasConsented.value).toBe(false);
  });
});
