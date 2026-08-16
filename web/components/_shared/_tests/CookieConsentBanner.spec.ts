// @vitest-environment nuxt
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderSuspended } from '@nuxt/test-utils/runtime';
import { screen, waitFor, fireEvent, cleanup } from '@testing-library/vue';
import { createVuetify } from 'vuetify';

import { useCookieConsent } from '@/composables/useCookieConsent';

import CookieConsentBanner from '../CookieConsentBanner.vue';

// ! happy-dom has no `visualViewport`, and Vuetify's overlay positioning reaches for it as a bare
// ! global — optional chaining does not save an *undeclared* name from a ReferenceError, so it has
// ! to be defined rather than guarded. Every Vuetify overlay (dialogs included) needs this.
vi.stubGlobal('visualViewport', null);

/** No consent cookie at all — see `composables/_tests/useCookieConsent.spec.ts` on the shape. */
function arriveWithoutADecision() {
  document.cookie =
    'cookie_consent=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

/** Nuxt writes the cookie asynchronously, so wait for the decision rather than for the scheduler. */
function decisionRecorded() {
  return waitFor(() => expect(useCookieConsent().isDecided.value).toBe(true));
}

/** The banner announces itself as a region labelled by the consent copy. */
function banner() {
  return screen.queryByRole('region', { name: 'Cookie consent' });
}

/**
 * ! Vuetify has to be supplied here even though the app installs it in a plugin: `renderSuspended`
 * ! gives the component the Nuxt runtime, not the Vue plugins that plugin registers, and every
 * ! Vuetify component fails on a missing defaults instance without it. A bare instance is enough —
 * ! the theme and locale wiring is `plugins/vuetify.ts`'s contract, tested in its own spec.
 */
function renderBanner() {
  return renderSuspended(CookieConsentBanner, {
    global: { plugins: [createVuetify()] }
  });
}

describe('CookieConsentBanner', () => {
  beforeEach(() => {
    arriveWithoutADecision();
  });

  // ! `cleanup` alone is not enough: the bottom sheet teleports its overlay to `body`, outside the
  // ! container Testing Library owns, so the previous test's banner survives into the next one and
  // ! every "does not ask again" case passes or fails on stale markup.
  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  it('asks a visitor who has not decided yet', async () => {
    await renderBanner();

    await waitFor(() => expect(banner()).not.toBeNull());
  });

  it('does not ask again once the visitor has accepted', async () => {
    useCookieConsent().accept();
    await decisionRecorded();

    await renderBanner();

    expect(banner()).toBeNull();
  });

  // ! Declining must silence the banner as firmly as accepting does; a banner that keeps asking
  // ! until it hears yes is the dark pattern this component exists to avoid.
  it('does not ask again once the visitor has declined', async () => {
    useCookieConsent().decline();
    await decisionRecorded();

    await renderBanner();

    expect(banner()).toBeNull();
  });

  it('records consent and dismisses itself when the visitor accepts', async () => {
    await renderBanner();
    await waitFor(() => expect(banner()).not.toBeNull());

    await fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    expect(useCookieConsent().hasConsented.value).toBe(true);
    await waitFor(() => expect(banner()).toBeNull());
  });

  it('records the refusal and dismisses itself when the visitor declines', async () => {
    await renderBanner();
    await waitFor(() => expect(banner()).not.toBeNull());

    await fireEvent.click(screen.getByRole('button', { name: 'Decline' }));

    const { isDecided, hasConsented } = useCookieConsent();

    expect(isDecided.value).toBe(true);
    expect(hasConsented.value).toBe(false);
    await waitFor(() => expect(banner()).toBeNull());
  });
});
