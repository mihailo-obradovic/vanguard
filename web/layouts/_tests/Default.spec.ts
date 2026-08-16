// @vitest-environment nuxt
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderSuspended } from '@nuxt/test-utils/runtime';
import { screen, fireEvent, cleanup, waitFor } from '@testing-library/vue';
import { createVuetify } from 'vuetify';

import { server } from '@/mocks/server';
import { authHandlers } from '@/mocks/handlers/auth';
import { recordRequests } from '@/mocks/requests';
import { buildUser } from '@/mocks/fixtures';
import { useAuthStore } from '@/stores/useAuthStore';

import Default from '../Default.vue';

// ! See CookieConsentBanner.spec.ts — Vuetify's overlays reach for this bare global.
vi.stubGlobal('visualViewport', null);

const requests = recordRequests();

/**
 * Render on a Vuetify instance the caller keeps hold of, so a test can read the theme the layout
 * put it in — the same way `plugins/_tests/vuetify.spec.ts` reads the locale off the instance.
 */
async function renderLayout() {
  const vuetify = createVuetify();

  await renderSuspended(Default, { global: { plugins: [vuetify] } });

  return vuetify;
}

/** Everything the user can act on in the chrome, by its accessible name. */
function actionNames() {
  return [
    ...screen.queryAllByRole('button'),
    ...screen.queryAllByRole('link')
  ].map((element) => element.textContent?.trim());
}

/** The cookie the theme choice is carried to the next page load in. */
function storedTheme() {
  return document.cookie
    .split('; ')
    .find((entry) => entry.startsWith('theme='))
    ?.split('=')[1];
}

function has(name: string) {
  return actionNames().some((label) => label === name);
}

describe('the default layout', () => {
  beforeEach(() => {
    // ! The theme cookie outlives a test; without this the second toggle case starts from the
    // ! first one's leftover 'dark' and reads backwards.
    document.cookie = 'theme=; path=/; max-age=0';
    requests.reset();
    server.use(...authHandlers());
    useAuthStore().resetUser();
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  it('offers a guest the ways in, and no way out', async () => {
    await renderLayout();

    expect(has('Login')).toBe(true);
    expect(has('Register')).toBe(true);
    expect(has('Logout')).toBe(false);
  });

  it('offers a signed-in user their profile and the way out', async () => {
    useAuthStore().setUser(buildUser());

    await renderLayout();

    expect(has('Profile')).toBe(true);
    expect(has('Logout')).toBe(true);
    expect(has('Login')).toBe(false);
    expect(has('Register')).toBe(false);
  });

  // ! The admin-only drawer entries are the security-adjacent part of this layout. They are a
  // ! convenience, not the control — the API authorizes every one of those pages independently —
  // ! but showing them to an ordinary user advertises a door they cannot open.
  it('keeps the admin sections out of an ordinary user’s drawer', async () => {
    useAuthStore().setUser(buildUser({ role: 'user' }));

    await renderLayout();

    expect(has('Users')).toBe(false);
    expect(has('GraphQL Demo')).toBe(false);
  });

  it('shows the admin sections to an admin', async () => {
    useAuthStore().setUser(buildUser({ role: 'admin' }));

    await renderLayout();

    expect(has('Users')).toBe(true);
    expect(has('GraphQL Demo')).toBe(true);
  });

  it('hides the admin sections from a signed-out visitor', async () => {
    await renderLayout();

    expect(has('Users')).toBe(false);
  });

  it('logs the user out through the session endpoint', async () => {
    useAuthStore().setUser(buildUser());

    await renderLayout();

    await fireEvent.click(screen.getByRole('button', { name: /Logout/ }));

    await waitFor(() => expect(requests.trace()).toContain('POST /logout'));
  });

  // ! The three auth dialogs are mutually exclusive and each closes itself before emitting, so the
  // ! layout's openers only raise their own flag. Nothing else proves that wiring — the dialogs
  // ! themselves stay on the browser walk.
  describe('the auth dialogs it owns', () => {
    it('opens the login dialog from the app bar', async () => {
      await renderLayout();

      await fireEvent.click(screen.getByRole('button', { name: 'Login' }));

      expect(await screen.findByText('Welcome Back')).toBeTruthy();
    });

    it('opens the registration dialog from the app bar', async () => {
      await renderLayout();

      await fireEvent.click(screen.getByRole('button', { name: 'Register' }));

      expect(await screen.findByText('Create Account')).toBeTruthy();
    });

    it('swaps login for registration when the visitor has no account', async () => {
      await renderLayout();

      await fireEvent.click(screen.getByRole('button', { name: 'Login' }));
      await screen.findByText('Welcome Back');

      await fireEvent.click(
        screen.getByRole('button', { name: /Register here/ })
      );

      expect(await screen.findByText('Create Account')).toBeTruthy();
    });

    it('swaps login for the reset request when the visitor forgot their password', async () => {
      await renderLayout();

      await fireEvent.click(screen.getByRole('button', { name: 'Login' }));
      await screen.findByText('Welcome Back');

      await fireEvent.click(
        screen.getByRole('button', { name: /Forgot your password\?/ })
      );

      expect(await screen.findByText('Forgot Password')).toBeTruthy();
    });

    it('closes the login dialog once the session is established', async () => {
      await renderLayout();

      await fireEvent.click(screen.getByRole('button', { name: 'Login' }));
      await screen.findByText('Welcome Back');

      await fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

      await waitFor(() => expect(requests.trace()).toContain('POST /login'));

      // ! By role, not by text: a closed Vuetify overlay is `v-show`n, so its markup — the title
      // ! included — stays in the DOM and only leaves the accessibility tree.
      await waitFor(() =>
        expect(screen.queryByRole('button', { name: 'Confirm' })).toBeNull()
      );
    });
  });

  // ! Under `ssr: false` the app paints its default theme first and corrects after mount, so the
  // ! stored preference is applied in `onMounted` and written back through a cookie — the only
  // ! thing that carries the choice to the next page load.
  describe('the theme it remembers', () => {
    it('switches the theme when the toggle is pressed', async () => {
      await renderLayout();

      await fireEvent.click(
        screen.getByRole('button', { name: 'Toggle dark mode' })
      );

      await waitFor(() => expect(storedTheme()).toBe('dark'));
    });

    it('switches back on a second press', async () => {
      await renderLayout();

      const toggle = screen.getByRole('button', { name: 'Toggle dark mode' });

      await fireEvent.click(toggle);
      await waitFor(() => expect(storedTheme()).toBe('dark'));

      await fireEvent.click(toggle);
      await waitFor(() => expect(storedTheme()).toBe('light'));
    });

    // ! The only case proving the cookie is read back rather than merely written. Asserted on the
    // ! Vuetify instance the layout switched, not on the class it renders — the class is the
    // ! framework's business, and the applied styling itself is a live-browser matter.
    it('opens in the theme the visitor last chose', async () => {
      document.cookie = 'theme=dark; path=/';

      const vuetify = await renderLayout();

      await waitFor(() => expect(vuetify.theme.global.name.value).toBe('dark'));
    });
  });
});
