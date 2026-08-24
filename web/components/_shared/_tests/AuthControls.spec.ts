// @vitest-environment nuxt
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { h } from 'vue';
import { renderSuspended } from '@nuxt/test-utils/runtime';
import { screen, fireEvent, cleanup, waitFor } from '@testing-library/vue';

import { UApp } from '#components';

import { server } from '@/mocks/server';
import { authHandlers } from '@/mocks/handlers/auth';
import { recordRequests } from '@/mocks/requests';
import { buildUser } from '@/mocks/fixtures';
import { useAuthStore } from '@/stores/useAuthStore';

import AuthControls from '../AuthControls.vue';

const requests = recordRequests();

// * `<UApp>` above it for the overlay provider — this component's whole job on the signed-out side
// * is opening dialogs through `useOverlay`, and without the provider there is nowhere to open them.
function renderControls() {
  return renderSuspended({
    setup: () => () => h(UApp, null, { default: () => h(AuthControls) })
  });
}

function dialog(title: string) {
  return screen.queryByRole('heading', { name: title });
}

/**
 * Report a viewport too narrow for the header to hold its labels.
 *
 * ! The environment answers `min-width` queries as matching and `max-width` ones as missing, so it
 * ! reads as a desktop and the compact branch is unreachable. Returns its own undo.
 */
function reportCompactHeader() {
  const real = window.matchMedia;

  window.matchMedia = ((query: string) =>
    ({
      matches: query.includes('max-width'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false
    }) as unknown as MediaQueryList) as typeof window.matchMedia;

  return () => {
    window.matchMedia = real;
  };
}

describe('AuthControls', () => {
  beforeEach(() => {
    requests.reset();
    server.use(...authHandlers());
    useAuthStore().resetUser();
  });

  afterEach(() => {
    cleanup();
  });

  it('offers a guest both ways in, and no way out', async () => {
    await renderControls();

    expect(screen.getByRole('button', { name: 'Login' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Register' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Logout' })).toBeNull();
  });

  it('names the signed-in user on the way to their profile', async () => {
    useAuthStore().setUser(buildUser({ name: 'Mihailo' }));

    await renderControls();

    expect(screen.getByRole('link', { name: 'Mihailo' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Logout' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Login' })).toBeNull();
  });

  it('opens the login dialog', async () => {
    await renderControls();

    await fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => expect(dialog('Welcome Back')).toBeTruthy());
  });

  it('opens the register dialog', async () => {
    await renderControls();

    await fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => expect(dialog('Create Account')).toBeTruthy());
  });

  // ! The reason `openAuth` calls itself. A dialog that wants to hand over resolves with the name of
  // ! the next one instead of a user, and the recursion is the only thing that opens it — a handle
  // ! from `useOverlay` is single-use, so the first dialog cannot open the second itself. Without
  // ! this the switch links are dead ends that just close the dialog.
  it('follows a dialog that hands over to another one', async () => {
    await renderControls();

    await fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    await waitFor(() => expect(dialog('Welcome Back')).toBeTruthy());

    await fireEvent.click(
      screen.getByRole('button', { name: /Register here/ })
    );

    await waitFor(() => expect(dialog('Create Account')).toBeTruthy());
    expect(dialog('Welcome Back')).toBeNull();
  });

  // * The same handover, to a third dialog, so the recursion is shown to be general rather than a
  // * hard-wired login-to-register pair.
  it('follows the handover to password recovery too', async () => {
    await renderControls();

    await fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    await waitFor(() => expect(dialog('Welcome Back')).toBeTruthy());

    await fireEvent.click(
      screen.getByRole('button', { name: /Forgot your password/ })
    );

    await waitFor(() => expect(dialog('Forgot Password')).toBeTruthy());
  });

  // * A dialog that resolves with a user, not a dialog name, ends the chain rather than reopening.
  it('stops when a dialog finishes instead of handing over', async () => {
    await renderControls();

    await fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    await waitFor(() => expect(dialog('Welcome Back')).toBeTruthy());

    await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(dialog('Welcome Back')).toBeNull());
    expect(dialog('Create Account')).toBeNull();
  });

  // ! Below `sm` the bar cannot hold its labels, so both controls drop to icons. The name has to
  // ! move to `aria-label` in the same step — a button with neither label nor slot content is how
  // ! the icon-only shape is asked for, and it would otherwise lose its accessible name entirely.
  it('drops to icons on a narrow header without going unnamed', async () => {
    const restore = reportCompactHeader();

    try {
      useAuthStore().setUser(buildUser({ name: 'Mihailo' }));

      await renderControls();

      const logout = screen.getByRole('button', { name: 'Logout' });
      const profile = screen.getByRole('link', { name: 'Mihailo' });

      expect(logout.textContent?.trim()).toBe('');
      expect(profile.textContent?.trim()).toBe('');
    } finally {
      restore();
    }
  });

  // * Reopening must not show what the user abandoned last time. That comes from `openAuth` calling
  // * `create()` per open, not from the `destroyOnClose` beside it — dropping that flag leaves this
  // * green, which is why the register records its mutants as equivalent rather than untested.
  it('reopens a dialog fresh rather than as the user left it', async () => {
    await renderControls();

    await fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    await waitFor(() => expect(dialog('Welcome Back')).toBeTruthy());

    const email = screen.getByLabelText('Email') as HTMLInputElement;
    const seeded = email.value;

    await fireEvent.update(email, 'someone-else@example.com');
    await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(dialog('Welcome Back')).toBeNull());

    await fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    await waitFor(() => expect(dialog('Welcome Back')).toBeTruthy());

    expect((screen.getByLabelText('Email') as HTMLInputElement).value).toBe(
      seeded
    );
  });

  it('logs the user out through the session endpoint', async () => {
    useAuthStore().setUser(buildUser());

    await renderControls();

    await fireEvent.click(screen.getByRole('button', { name: 'Logout' }));

    await waitFor(() => expect(requests.trace()).toContain('POST /logout'));
  });
});
