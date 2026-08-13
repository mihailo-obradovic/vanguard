// @vitest-environment nuxt
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderSuspended } from '@nuxt/test-utils/runtime';
import { screen, fireEvent, cleanup, waitFor } from '@testing-library/vue';
import { createVuetify } from 'vuetify';

import LocaleSwitcher from '../LocaleSwitcher.vue';

// ! happy-dom has no `visualViewport`, and Vuetify's overlay positioning reaches for it as a bare
// ! global — optional chaining does not save an *undeclared* name from a ReferenceError.
vi.stubGlobal('visualViewport', null);

/** The key `detectBrowserLanguage.cookieKey` pins in `nuxt.config.ts`. */
const LOCALE_COOKIE = 'i18n_locale';

function persistedLocale() {
  return document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${LOCALE_COOKIE}=`))
    ?.split('=')[1];
}

/** Vuetify needs supplying by hand — `renderSuspended` does not run the Nuxt plugin that installs it. */
function renderSwitcher() {
  return renderSuspended(LocaleSwitcher, {
    global: { plugins: [createVuetify()] }
  });
}

/** Open the menu the way a user does, then wait for the list to arrive. */
async function openTheMenu() {
  await fireEvent.click(screen.getByRole('button', { name: 'Language' }));

  await waitFor(() => expect(screen.getAllByRole('listitem').length).toBe(3));
}

function localeNames() {
  return screen
    .getAllByRole('listitem')
    .map((item) => item.textContent?.trim());
}

describe('LocaleSwitcher', () => {
  beforeEach(async () => {
    await useNuxtApp().$i18n.setLocale('en');
  });

  afterEach(() => {
    cleanup();
    // ! The menu content teleports to body, outside the container `cleanup` owns.
    document.body.innerHTML = '';
  });

  it('offers every configured locale under its own name', async () => {
    await renderSwitcher();
    await openTheMenu();

    expect(localeNames()).toEqual(['English', 'Srpski', 'Српски']);
  });

  it('switches the language when a locale is picked', async () => {
    await renderSwitcher();
    await openTheMenu();

    await fireEvent.click(screen.getByText('Srpski'));

    await waitFor(() =>
      expect(useNuxtApp().$i18n.locale.value).toBe('sr-Latn')
    );
  });

  // ! This is why the handler calls `setLocale` instead of assigning `locale` directly: only
  // ! `setLocale` writes the detection cookie. Assigning `locale` switches the language just as
  // ! visibly and then forgets it on the next page load, which no rendered assertion would catch —
  // ! so the persisted cookie is what this asserts.
  it('persists the choice, so it survives the next page load', async () => {
    await renderSwitcher();
    await openTheMenu();

    await fireEvent.click(screen.getByText('Srpski'));

    await waitFor(() => expect(persistedLocale()).toBe('sr-Latn'));
  });
});
