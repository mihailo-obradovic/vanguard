// @vitest-environment nuxt
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderSuspended } from '@nuxt/test-utils/runtime';
import { screen, fireEvent, cleanup, waitFor } from '@testing-library/vue';

import { server } from '@/mocks/server';
import { authHandlers } from '@/mocks/handlers/auth';

import LocaleSwitcher from '../LocaleSwitcher.vue';

/** The key `detectBrowserLanguage.cookieKey` pins in `nuxt.config.ts`. */
const LOCALE_COOKIE = 'i18n_locale';

function persistedLocale() {
  return document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${LOCALE_COOKIE}=`))
    ?.split('=')[1];
}

function switcher() {
  return screen.getByRole('combobox') as HTMLSelectElement;
}

/**
 * Pick a locale the way a user does.
 *
 * ! `fireEvent.update` drives `input`, which a `<select>`'s v-model does not listen for — it
 * ! binds `change`. The wrong event leaves the component untouched and the test green only
 * ! against assertions weak enough not to notice. Switching is also asynchronous — it loads the
 * ! catalog — so the assertions wait rather than settling on a fixed delay.
 */
async function pick(code: string) {
  const select = switcher();

  select.value = code;

  await fireEvent.change(select);
}

describe('LocaleSwitcher', () => {
  beforeEach(async () => {
    // * The app's own plugins boot around these renders; without the session handlers their
    // * requests fail the run as unhandled.
    server.use(...authHandlers());
    await useNuxtApp().$i18n.setLocale('en');
  });

  afterEach(() => {
    cleanup();
  });

  it('offers every configured locale under its own name', async () => {
    await renderSuspended(LocaleSwitcher);

    expect(
      screen.getAllByRole('option').map((option) => option.textContent?.trim())
    ).toEqual(['English', 'Srpski', 'Српски']);
  });

  it('shows the active locale as the selected one', async () => {
    await useNuxtApp().$i18n.setLocale('sr-Cyrl');

    await renderSuspended(LocaleSwitcher);

    expect(switcher().value).toBe('sr-Cyrl');
  });

  it('switches the language when a locale is picked', async () => {
    await renderSuspended(LocaleSwitcher);

    await pick('sr-Latn');

    await waitFor(() =>
      expect(useNuxtApp().$i18n.locale.value).toBe('sr-Latn')
    );
  });

  // ! This is why the setter writes through `setLocale` instead of assigning `locale` directly:
  // ! only `setLocale` writes the detection cookie. Assigning `locale` switches the language just
  // ! as visibly and then forgets it on the next page load, which no rendered assertion would
  // ! catch — so the persisted cookie is what this asserts.
  it('persists the choice, so it survives the next page load', async () => {
    await renderSuspended(LocaleSwitcher);

    await pick('sr-Latn');

    await waitFor(() => expect(persistedLocale()).toBe('sr-Latn'));
  });
});
