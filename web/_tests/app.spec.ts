// @vitest-environment nuxt
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import { nextTick } from 'vue';

import { server } from '@/mocks/server';
import { authHandlers } from '@/mocks/handlers/auth';
import { buildUser } from '@/mocks/fixtures';
import { useAuthStore } from '@/stores/useAuthStore';

import App from '../app.vue';

const { navigateTo, route } = vi.hoisted(() => ({
  navigateTo: vi.fn<(to: string, options?: { replace?: boolean }) => void>(),
  route: { path: '/home', query: {} as Record<string, string> }
}));

mockNuxtImport('navigateTo', () => navigateTo);
mockNuxtImport('useRoute', () => () => route);

// * The shell renders the router and the consent banner; neither is what this spec is about.
const stubs = {
  NuxtLoadingIndicator: true,
  NuxtLayout: true,
  NuxtPage: true,
  CookieConsentBanner: true
};

/**
 * Mount the shell on `path`, then flip the session and let the watcher run.
 *
 * * The flip has to happen after the mount: the watcher is what this spec exercises, and a store
 * * already in the target state when the shell appears never triggers it.
 */
async function signIn(path: string, direction: 'in' | 'out') {
  const store = useAuthStore();

  route.path = path;

  if (direction === 'in') {
    store.resetUser();
  } else {
    store.setUser(buildUser());
  }

  await mountSuspended(App, { global: { stubs } });

  navigateTo.mockClear();

  if (direction === 'in') {
    store.setUser(buildUser());
  } else {
    store.resetUser();
  }

  await nextTick();
}

describe('the app shell', () => {
  beforeEach(() => {
    navigateTo.mockClear();
    server.use(...authHandlers());
    useAuthStore().resetUser();
    route.query = {};
  });

  // ! This watcher is the only thing that re-evaluates the redirect when the session changes
  // ! without a navigation — logging in and out happen in dialogs, so `middleware/auth.global.ts`
  // ! never runs for them and the user would sit on a page they can no longer reach.
  // * `replace` is asserted rather than any-options: the page the session just made unreachable
  // * must not stay one Back away.
  it('sends a user who signs out away from a page they can no longer reach', async () => {
    await signIn('/users', 'out');

    expect(navigateTo).toHaveBeenCalledWith('/home', { replace: true });
  });

  it('sends a user who signs in away from a guest-only page', async () => {
    await signIn('/password-reset', 'in');

    expect(navigateTo).toHaveBeenCalledWith('/home', { replace: true });
  });

  it('stays put when the new session still allows the current page', async () => {
    await signIn('/home', 'in');

    expect(navigateTo).not.toHaveBeenCalled();
  });

  // ! Not `immediate` on purpose: the global middleware already decides the first navigation, and
  // ! an immediate watcher would redirect a second time from under it on every page load.
  it('leaves the first navigation to the route middleware', async () => {
    useAuthStore().resetUser();
    route.path = '/users';

    await mountSuspended(App, { global: { stubs } });
    await nextTick();

    expect(navigateTo).not.toHaveBeenCalled();
  });
});
