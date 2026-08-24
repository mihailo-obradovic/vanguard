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

import Default from '../Default.vue';

// * The layout's slideover needs `<UApp>` above it for its overlay provider, so the harness supplies one.
function renderLayout() {
  return renderSuspended({
    setup: () => () => h(UApp, null, { default: () => h(Default) })
  });
}

const requests = recordRequests();

function linkNames() {
  return screen.getAllByRole('link').map((link) => link.textContent?.trim());
}

/**
 * Report a viewport too narrow for the inline sidebar.
 *
 * ! The environment answers the `min-width` queries as matching, so `useBreakpoints` reads a desktop
 * ! and only the inline-aside half of `toggleDrawer` is ever reachable. Forcing every query to miss
 * ! is what makes the slideover half testable; returns its own undo so the next test is unaffected.
 */
function reportNarrowViewport() {
  const real = window.matchMedia;

  window.matchMedia = ((query: string) =>
    ({
      matches: false,
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

describe('the default layout', () => {
  beforeEach(() => {
    requests.reset();
    server.use(...authHandlers());
    useAuthStore().resetUser();
  });

  afterEach(() => {
    cleanup();
  });

  // ! The landmark SkipLink jumps to, and the jump does not work without the `tabindex`, silently: a fragment link alone only sets the tab-navigation start point, and `.focus()` on a non-focusable element is a no-op.
  it('publishes a focusable main landmark', async () => {
    await renderLayout();

    const main = screen.getByRole('main');

    expect(main.id).toBe('main-content');
    expect(main.getAttribute('tabindex')).toBe('-1');
  });

  // * Both ways in open dialogs rather than navigating, so they are buttons here, not links.
  it('offers a guest the ways in, and nothing else', async () => {
    await renderLayout();

    expect(screen.getByRole('button', { name: 'Login' })).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Register' })).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Logout' })).toBeNull();
  });

  it('greets a signed-in user by name and offers the way out', async () => {
    useAuthStore().setUser(buildUser({ name: 'Mihailo' }));

    await renderLayout();

    expect(linkNames()).toContain('Mihailo');
    expect(screen.getByRole('button', { name: 'Logout' })).not.toBeNull();
    expect(linkNames()).not.toContain('Login');
  });

  // ! The admin-only links are the security-adjacent part of this layout. They are a convenience,
  // ! not the control — the API authorizes every one of those pages independently — but showing
  // ! them to an ordinary user advertises a door they cannot open.
  it('keeps the admin sections out of an ordinary user’s navigation', async () => {
    useAuthStore().setUser(buildUser({ role: 'user' }));

    await renderLayout();

    expect(linkNames()).not.toContain('Users');
    expect(linkNames()).not.toContain('GraphQL Demo');
  });

  it('shows the admin sections to an admin', async () => {
    useAuthStore().setUser(buildUser({ role: 'admin' }));

    await renderLayout();

    expect(linkNames()).toContain('Users');
  });

  it('hides the admin sections from a signed-out visitor', async () => {
    await renderLayout();

    expect(linkNames()).not.toContain('Users');
  });

  it('logs the user out through the session endpoint', async () => {
    useAuthStore().setUser(buildUser());

    await renderLayout();

    await fireEvent.click(screen.getByRole('button', { name: 'Logout' }));

    await waitFor(() => expect(requests.trace()).toContain('POST /logout'));
  });

  // ! `toggleDrawer` picks its target by viewport, and the two halves are different drawers: the
  // ! inline aside starts open and the slideover starts closed, so a single mixed-up branch either
  // ! does nothing visible or closes a sidebar the narrow viewport never showed.
  it('collapses the inline sidebar on a wide viewport', async () => {
    useAuthStore().setUser(buildUser({ role: 'admin' }));

    await renderLayout();

    expect(document.querySelector('aside')).not.toBeNull();

    await fireEvent.click(
      screen.getByRole('button', { name: 'Toggle navigation' })
    );

    // ! Queried through the DOM, not the accessibility tree. Opening the slideover marks the rest of
    // ! the page `aria-hidden`, so `queryByRole('complementary')` goes null either way — against the
    // ! wrong branch as readily as the right one, which makes it no assertion at all here.
    await waitFor(() => expect(document.querySelector('aside')).toBeNull());

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens the slideover on a narrow one', async () => {
    const restore = reportNarrowViewport();

    try {
      useAuthStore().setUser(buildUser({ role: 'admin' }));

      await renderLayout();

      expect(screen.queryByRole('dialog')).toBeNull();

      await fireEvent.click(
        screen.getByRole('button', { name: 'Toggle navigation' })
      );

      // * Only the slideover: the narrow branch must not also collapse the inline aside. It cannot
      // * be asserted through the accessibility tree here — an open modal marks the rest of the page
      // * `aria-hidden`, so the aside leaves the tree by design — hence the DOM query.
      await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy());

      expect(document.querySelector('aside')).not.toBeNull();
    } finally {
      restore();
    }
  });
});
