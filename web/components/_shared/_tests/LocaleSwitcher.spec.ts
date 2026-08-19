// @vitest-environment nuxt
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { waitFor } from '@testing-library/vue';

import { USelect } from '#components';

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

let wrapper: Awaited<ReturnType<typeof mountSuspended>> | null = null;

async function mountSwitcher() {
  wrapper = await mountSuspended(LocaleSwitcher);

  return wrapper.findComponent(USelect);
}

/**
 * Pick a locale the way the control reports one.
 *
 * ! Driven through the select's own `update:modelValue` rather than by clicking an option: Nuxt
 * ! UI's select is a Reka listbox that commits through pointer-capture APIs jsdom does not
 * ! implement, so no click, pointer sequence or keypress moves it — verified, including with the
 * ! usual `hasPointerCapture`/`scrollIntoView` stubs. That the listbox commits on a click is the
 * ! library's own contract to keep; what belongs here is what this component does with the value,
 * ! which is the part that has a bug in it worth catching.
 */
function pick(select: Awaited<ReturnType<typeof mountSwitcher>>, code: string) {
  select.vm.$emit('update:modelValue', code);
}

describe('LocaleSwitcher', () => {
  beforeEach(async () => {
    // * The app's own plugins boot around these renders; without the session handlers their
    // * requests fail the run as unhandled.
    server.use(...authHandlers());
    await useNuxtApp().$i18n.setLocale('en');
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  it('offers every configured locale under its own name', async () => {
    const select = await mountSwitcher();

    expect(
      (select.props('items') as { label: string }[]).map((item) => item.label)
    ).toEqual(['English', 'Srpski', 'Српски']);
  });

  it('shows the active locale as the selected one', async () => {
    await useNuxtApp().$i18n.setLocale('sr-Cyrl');

    const select = await mountSwitcher();

    expect(select.props('modelValue')).toBe('sr-Cyrl');
  });

  it('switches the language when a locale is picked', async () => {
    const select = await mountSwitcher();

    pick(select, 'sr-Latn');

    // * Switching loads the catalog, so the assertion waits rather than settling on a fixed delay.
    await waitFor(() =>
      expect(useNuxtApp().$i18n.locale.value).toBe('sr-Latn')
    );
  });

  // ! This is why the setter writes through `setLocale` instead of assigning `locale` directly:
  // ! only `setLocale` writes the detection cookie. Assigning `locale` switches the language just
  // ! as visibly and then forgets it on the next page load, which no rendered assertion would
  // ! catch — so the persisted cookie is what this asserts.
  it('persists the choice, so it survives the next page load', async () => {
    const select = await mountSwitcher();

    pick(select, 'sr-Latn');

    await waitFor(() => expect(persistedLocale()).toBe('sr-Latn'));
  });
});
