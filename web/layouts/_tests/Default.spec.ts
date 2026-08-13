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

function renderLayout() {
  return renderSuspended(Default, {
    global: { plugins: [createVuetify()] }
  });
}

/** Everything the user can act on in the chrome, by its accessible name. */
function actionNames() {
  return [
    ...screen.queryAllByRole('button'),
    ...screen.queryAllByRole('link')
  ].map((element) => element.textContent?.trim());
}

function has(name: string) {
  return actionNames().some((label) => label === name);
}

describe('the default layout', () => {
  beforeEach(() => {
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
});
