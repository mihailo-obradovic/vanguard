// @vitest-environment nuxt
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderSuspended } from '@nuxt/test-utils/runtime';
import { screen, fireEvent, cleanup, waitFor } from '@testing-library/vue';

import { server } from '@/mocks/server';
import { authHandlers } from '@/mocks/handlers/auth';
import { recordRequests } from '@/mocks/requests';
import { buildUser } from '@/mocks/fixtures';
import { useAuthStore } from '@/stores/useAuthStore';

import Default from '../Default.vue';

const requests = recordRequests();

function linkNames() {
  return screen.getAllByRole('link').map((link) => link.textContent?.trim());
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

  // ! The landmark two features move focus to — SkipLink's jump and UIDialog's dead-opener fallback — and neither works without the `tabindex`, silently: a fragment link alone only sets the tab-navigation start point, and `.focus()` on a non-focusable element is a no-op.
  it('publishes a focusable main landmark', async () => {
    await renderSuspended(Default);

    const main = screen.getByRole('main');

    expect(main.id).toBe('main-content');
    expect(main.getAttribute('tabindex')).toBe('-1');
  });

  // * Both ways in open dialogs rather than navigating, so they are buttons here, not links.
  it('offers a guest the ways in, and nothing else', async () => {
    await renderSuspended(Default);

    expect(screen.getByRole('button', { name: 'Login' })).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Register' })).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Logout' })).toBeNull();
  });

  it('greets a signed-in user by name and offers the way out', async () => {
    useAuthStore().setUser(buildUser({ name: 'Mihailo' }));

    await renderSuspended(Default);

    expect(linkNames()).toContain('Mihailo');
    expect(screen.getByRole('button', { name: 'Logout' })).not.toBeNull();
    expect(linkNames()).not.toContain('Login');
  });

  // ! The admin-only links are the security-adjacent part of this layout. They are a convenience,
  // ! not the control — the API authorizes every one of those pages independently — but showing
  // ! them to an ordinary user advertises a door they cannot open.
  it('keeps the admin sections out of an ordinary user’s navigation', async () => {
    useAuthStore().setUser(buildUser({ role: 'user' }));

    await renderSuspended(Default);

    expect(linkNames()).not.toContain('Users');
    expect(linkNames()).not.toContain('GraphQL Demo');
  });

  it('shows the admin sections to an admin', async () => {
    useAuthStore().setUser(buildUser({ role: 'admin' }));

    await renderSuspended(Default);

    expect(linkNames()).toContain('Users');
  });

  it('hides the admin sections from a signed-out visitor', async () => {
    await renderSuspended(Default);

    expect(linkNames()).not.toContain('Users');
  });

  it('logs the user out through the session endpoint', async () => {
    useAuthStore().setUser(buildUser());

    await renderSuspended(Default);

    await fireEvent.click(screen.getByRole('button', { name: 'Logout' }));

    await waitFor(() => expect(requests.trace()).toContain('POST /logout'));
  });
});
