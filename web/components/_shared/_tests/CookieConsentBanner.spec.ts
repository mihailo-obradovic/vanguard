// @vitest-environment nuxt
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderSuspended } from '@nuxt/test-utils/runtime';
import { screen, waitFor, fireEvent, cleanup } from '@testing-library/vue';

import { useCookieConsent } from '@/composables/useCookieConsent';

import CookieConsentBanner from '../CookieConsentBanner.vue';

/** No consent cookie at all — see `composables/_tests/useCookieConsent.spec.ts` on the shape. */
function arriveWithoutADecision() {
  document.cookie =
    'cookie_consent=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

function settleTheCookie() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/** The banner announces itself as a region labelled by the consent copy. */
function banner() {
  return screen.queryByRole('region', { name: 'Cookie consent' });
}

describe('CookieConsentBanner', () => {
  beforeEach(() => {
    arriveWithoutADecision();
  });

  afterEach(() => {
    cleanup();
  });

  // * The banner is hidden until mounted so the markup a returning visitor never needs does not
  // * flash on the first frame; `waitFor` is what lets that flag flip.
  it('asks a visitor who has not decided yet', async () => {
    await renderSuspended(CookieConsentBanner);

    await waitFor(() => expect(banner()).not.toBeNull());
  });

  it('does not ask again once the visitor has accepted', async () => {
    useCookieConsent().accept();
    await settleTheCookie();

    await renderSuspended(CookieConsentBanner);

    expect(banner()).toBeNull();
  });

  // ! Declining must silence the banner as firmly as accepting does; a banner that keeps asking
  // ! until it hears yes is the dark pattern this component exists to avoid.
  it('does not ask again once the visitor has declined', async () => {
    useCookieConsent().decline();
    await settleTheCookie();

    await renderSuspended(CookieConsentBanner);

    expect(banner()).toBeNull();
  });

  it('records consent and dismisses itself when the visitor accepts', async () => {
    await renderSuspended(CookieConsentBanner);
    await waitFor(() => expect(banner()).not.toBeNull());

    await fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    expect(useCookieConsent().hasConsented.value).toBe(true);
    await waitFor(() => expect(banner()).toBeNull());
  });

  it('records the refusal and dismisses itself when the visitor declines', async () => {
    await renderSuspended(CookieConsentBanner);
    await waitFor(() => expect(banner()).not.toBeNull());

    await fireEvent.click(screen.getByRole('button', { name: 'Decline' }));

    const { isDecided, hasConsented } = useCookieConsent();

    expect(isDecided.value).toBe(true);
    expect(hasConsented.value).toBe(false);
    await waitFor(() => expect(banner()).toBeNull());
  });
});
