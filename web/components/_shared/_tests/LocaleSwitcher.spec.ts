// @vitest-environment nuxt
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';

import { server } from '@/mocks/server';
import { authHandlers } from '@/mocks/handlers/auth';
import { Select, SelectItem } from '@/components/ui/select';

import LocaleSwitcher from '../LocaleSwitcher.vue';

/** The key `detectBrowserLanguage.cookieKey` pins in `nuxt.config.ts`. */
const LOCALE_COOKIE = 'i18n_locale';

function persistedLocale() {
  return document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${LOCALE_COOKIE}=`))
    ?.split('=')[1];
}

/**
 * Pick a locale the way a user does — at the component seam rather than through the listbox.
 *
 * ! Reka UI's listbox cannot be opened in this environment: clicking the trigger renders no
 * ! options at all (probed, not assumed — happy-dom has no popover or measurement support), so a
 * ! click-driven test would assert against an empty list and pass for the wrong reason. The
 * ! seam below is the contract this component actually owns: the value arriving from the Select
 * ! and the setter it runs. The rendered listbox is a live browser check (`catalyst/operations.md`).
 */
async function pick(
  wrapper: Awaited<ReturnType<typeof mountSuspended>>,
  code: string
) {
  wrapper.findComponent(Select).vm.$emit('update:modelValue', code);

  // * Switching loads the catalog, so the assertions wait rather than settling on a fixed delay.
  await vi.waitFor(() => expect(useNuxtApp().$i18n.locale.value).toBe(code));
}

describe('LocaleSwitcher', () => {
  beforeEach(async () => {
    // * The app's own plugins boot around these renders; without the session handlers their
    // * requests fail the run as unhandled.
    server.use(...authHandlers());
    await useNuxtApp().$i18n.setLocale('en');
  });

  it('offers every configured locale under its own name', async () => {
    const wrapper = await mountSuspended(LocaleSwitcher);

    expect(
      wrapper.findAllComponents(SelectItem).map((item) => ({
        code: item.props('value'),
        name: item.text()
      }))
    ).toEqual([
      { code: 'en', name: 'English' },
      { code: 'sr-Latn', name: 'Srpski' },
      { code: 'sr-Cyrl', name: 'Српски' }
    ]);
  });

  // ! The trigger's label is passed in rather than left to `SelectValue`'s own lookup, which
  // ! resolves through the items and reads empty until the list has been opened once. Asserting
  // ! the visible name is what would catch a regression back to that.
  it('names the active locale on the trigger', async () => {
    await useNuxtApp().$i18n.setLocale('sr-Cyrl');

    const wrapper = await mountSuspended(LocaleSwitcher);

    expect(wrapper.get('[role="combobox"]').text()).toBe('Српски');
  });

  it('switches the language when a locale is picked', async () => {
    const wrapper = await mountSuspended(LocaleSwitcher);

    await pick(wrapper, 'sr-Latn');

    expect(useNuxtApp().$i18n.locale.value).toBe('sr-Latn');
  });

  // ! This is why the setter writes through `setLocale` instead of assigning `locale` directly:
  // ! only `setLocale` writes the detection cookie. Assigning `locale` switches the language just
  // ! as visibly and then forgets it on the next page load, which no rendered assertion would
  // ! catch — so the persisted cookie is what this asserts.
  it('persists the choice, so it survives the next page load', async () => {
    const wrapper = await mountSuspended(LocaleSwitcher);

    await pick(wrapper, 'sr-Latn');

    await vi.waitFor(() => expect(persistedLocale()).toBe('sr-Latn'));
  });
});
