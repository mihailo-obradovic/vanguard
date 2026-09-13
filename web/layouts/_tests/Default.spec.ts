// @vitest-environment nuxt
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mockNuxtImport, renderSuspended } from '@nuxt/test-utils/runtime';
import {
  screen,
  fireEvent,
  cleanup,
  waitFor,
  within
} from '@testing-library/vue';

import { http, HttpResponse } from 'msw';

import { server } from '@/mocks/server';
import { apiUrl } from '@/mocks/api';
import { authHandlers } from '@/mocks/handlers/auth';
import { recordRequests } from '@/mocks/requests';
import { buildUser } from '@/mocks/fixtures';
import { useAuthStore } from '@/stores/useAuthStore';

import Default from '../Default.vue';

const { navigateTo, toast } = vi.hoisted(() => ({
  navigateTo: vi.fn<(to: string) => void>(),
  toast: vi.fn<(message: string, type?: string) => void>()
}));

// * Where a finished dialog leads is this layout's call, so both exits are observed at the seam rather than through a router and a toast host this spec does not mount.
mockNuxtImport('navigateTo', () => navigateTo);
mockNuxtImport('$toast', () => toast);

const requests = recordRequests();

function linkNames() {
  return screen.getAllByRole('link').map((link) => link.textContent?.trim());
}

describe('the default layout', () => {
  beforeEach(() => {
    requests.reset();
    navigateTo.mockReset();
    toast.mockReset();
    server.use(...authHandlers());
    useAuthStore().resetUser();
  });

  afterEach(() => {
    cleanup();
  });

  // ! The landmark SkipLink's jump moves focus to, which does not work without the `tabindex`, silently: a fragment link alone only sets the tab-navigation start point, and `.focus()` on a non-focusable element is a no-op.
  it('publishes a focusable main landmark', async () => {
    await renderSuspended(Default);

    const main = screen.getByRole('main');

    expect(main.id).toBe('main-content');
    expect(main.getAttribute('tabindex')).toBe('-1');
  });

  // ! Login/Register open dialogs now, not routes — they are buttons, not links, and
  // ! `getAllByRole('link')` would silently stop seeing them if this regressed back to `<a>`.
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
    expect(screen.queryByRole('button', { name: 'Login' })).toBeNull();
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

  it('opens the login dialog from the nav', async () => {
    await renderSuspended(Default);

    await fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(
      await screen.findByRole('dialog', { name: 'Welcome Back' })
    ).not.toBeNull();
  });

  it('opens the register dialog from the nav', async () => {
    await renderSuspended(Default);

    await fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    expect(
      await screen.findByRole('dialog', { name: 'Create Account' })
    ).not.toBeNull();
  });

  // ! The three dialogs are mutually exclusive and hand off by event, owned entirely by this
  // ! layout (`useMutationDialog` per dialog + v-model + emit) — nothing about that wiring is
  // ! covered by the dialogs' own specs, which mock the hand-off emits rather than each other.
  it('hands off from login to forgot-password, closing one and opening the other', async () => {
    await renderSuspended(Default);

    await fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    await screen.findByRole('dialog', { name: 'Welcome Back' });

    await fireEvent.click(
      screen.getByRole('button', { name: 'Forgot your password?' })
    );

    expect(
      await screen.findByRole('dialog', { name: 'Forgot Password' })
    ).not.toBeNull();
    expect(screen.queryByRole('dialog', { name: 'Welcome Back' })).toBeNull();
  });

  it('hands off from login to register, closing one and opening the other', async () => {
    await renderSuspended(Default);

    await fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    await screen.findByRole('dialog', { name: 'Welcome Back' });

    await fireEvent.click(
      screen.getByRole('button', { name: /Register here/ })
    );

    expect(
      await screen.findByRole('dialog', { name: 'Create Account' })
    ).not.toBeNull();
    expect(screen.queryByRole('dialog', { name: 'Welcome Back' })).toBeNull();
  });

  describe('where a finished dialog leads', () => {
    function dialog(name: string) {
      return within(screen.getByRole('dialog', { name }));
    }

    it('sends a guest who signs in to the home page', async () => {
      await renderSuspended(Default);

      await fireEvent.click(screen.getByRole('button', { name: 'Login' }));
      await screen.findByRole('dialog', { name: 'Welcome Back' });
      await fireEvent.click(
        dialog('Welcome Back').getByRole('button', { name: 'Confirm' })
      );

      await waitFor(() => expect(navigateTo).toHaveBeenCalledWith('/home'));
    });

    it('sends a guest who registers to the home page', async () => {
      server.use(
        http.get(apiUrl('/api/email-availability'), () =>
          HttpResponse.json({ available: true })
        )
      );

      await renderSuspended(Default);

      await fireEvent.click(screen.getByRole('button', { name: 'Register' }));
      await screen.findByRole('dialog', { name: 'Create Account' });

      const form = dialog('Create Account');

      await fireEvent.update(form.getByLabelText(/^Name$/), 'Ana');
      await fireEvent.update(form.getByLabelText(/^Email$/), 'ana@example.com');
      await fireEvent.update(
        form.getByLabelText(/^Password$/),
        'hunter2hunter2'
      );
      await fireEvent.update(
        form.getByLabelText(/^Password confirmation$/),
        'hunter2hunter2'
      );

      const confirm = form.getByRole('button', {
        name: 'Confirm'
      }) as HTMLButtonElement;

      await waitFor(() => expect(confirm.disabled).toBe(false), {
        timeout: 3000
      });
      await fireEvent.click(confirm);

      await waitFor(() => expect(navigateTo).toHaveBeenCalledWith('/home'));
    });

    // * The confirmation copy is the server's, already localized — the layout shows it as received.
    it('tells a guest who asked for a reset link what the server said', async () => {
      await renderSuspended(Default);

      await fireEvent.click(screen.getByRole('button', { name: 'Login' }));
      await screen.findByRole('dialog', { name: 'Welcome Back' });
      await fireEvent.click(
        screen.getByRole('button', { name: 'Forgot your password?' })
      );
      await screen.findByRole('dialog', { name: 'Forgot Password' });

      const form = dialog('Forgot Password');

      await fireEvent.update(form.getByLabelText(/^Email$/), 'ana@example.com');
      await fireEvent.click(form.getByRole('button', { name: 'Confirm' }));

      await waitFor(() =>
        expect(toast).toHaveBeenCalledWith(
          'We have emailed your password reset link.',
          'success'
        )
      );
    });
  });

  // ! Reka restores focus to whatever was focused when a dialog opened. After a hand-off that element was inside the previous dialog, and after the drawer it was inside the drawer — both unmounted by the time this dialog closes, so without the layout naming the chain's origin, focus fell to <body>. Focus-then-click is how a keyboard user opens these; a bare click never moves focus and would fake the result.
  describe('focus after a dialog closes', () => {
    async function activate(element: HTMLElement) {
      element.focus();
      await fireEvent.click(element);
    }

    async function allDialogsClosed() {
      await waitFor(() =>
        expect(screen.queryAllByRole('dialog', { hidden: true })).toHaveLength(
          0
        )
      );
    }

    it('returns to the bar button that started a hand-off', async () => {
      await renderSuspended(Default);

      const login = screen.getByRole('button', { name: 'Login' });

      await activate(login);
      await screen.findByRole('dialog', { name: 'Welcome Back' });
      await activate(screen.getByRole('button', { name: /Register here/ }));
      await screen.findByRole('dialog', { name: 'Create Account' });
      await activate(screen.getByRole('button', { name: 'Cancel' }));
      await allDialogsClosed();

      await waitFor(() => expect(document.activeElement).toBe(login));
    });

    it.each([
      ['Login', 'Welcome Back'],
      ['Register', 'Create Account']
    ])(
      'returns to the menu button when %s, opened from the drawer, closes',
      async (control, title) => {
        await renderSuspended(Default);

        const menu = screen.getByRole('button', { name: 'Menu' });

        await activate(menu);
        const drawer = within(
          await screen.findByRole('dialog', { name: 'Menu' })
        );
        await activate(drawer.getByRole('button', { name: control }));
        await screen.findByRole('dialog', { name: title });
        await activate(screen.getByRole('button', { name: 'Cancel' }));
        await allDialogsClosed();

        await waitFor(() => expect(document.activeElement).toBe(menu));
      }
    );
  });

  // * The drawer below `lg`. Which rendering is visible is Tailwind's call, which happy-dom does not load, so these open the drawer explicitly; the width switch itself is a live browser check.
  describe('the phone-width drawer', () => {
    async function openDrawer() {
      await fireEvent.click(screen.getByRole('button', { name: 'Menu' }));

      return screen.findByRole('dialog', { name: 'Menu' });
    }

    it('offers an admin the same destinations as the bar', async () => {
      useAuthStore().setUser(buildUser({ role: 'admin', name: 'Mihailo' }));

      await renderSuspended(Default);

      const drawer = within(await openDrawer());

      expect(
        drawer.getAllByRole('link').map((link) => link.textContent?.trim())
      ).toEqual(['Home', 'Users', 'GraphQL Demo', 'Mihailo']);
      expect(drawer.getByRole('button', { name: 'Logout' })).not.toBeNull();
    });

    it('keeps the admin sections out of an ordinary user’s drawer', async () => {
      useAuthStore().setUser(buildUser({ role: 'user' }));

      await renderSuspended(Default);

      const drawer = within(await openDrawer());

      expect(drawer.queryByRole('link', { name: 'Users' })).toBeNull();
      expect(drawer.queryByRole('link', { name: 'GraphQL Demo' })).toBeNull();
    });

    it('closes before handing a guest to the login dialog', async () => {
      await renderSuspended(Default);

      const drawer = within(await openDrawer());

      await fireEvent.click(drawer.getByRole('button', { name: 'Login' }));

      expect(
        await screen.findByRole('dialog', { name: 'Welcome Back' })
      ).not.toBeNull();
      // ! Counted with `hidden: true`, not queried by name: the opened dialog marks everything else aria-hidden, and a drawer left open behind it then loses its accessible name too — a named query misses it and passes for the wrong reason.
      expect(screen.getAllByRole('dialog', { hidden: true })).toHaveLength(1);
    });

    it('closes before handing a guest to the register dialog', async () => {
      await renderSuspended(Default);

      const drawer = within(await openDrawer());

      await fireEvent.click(drawer.getByRole('button', { name: 'Register' }));

      expect(
        await screen.findByRole('dialog', { name: 'Create Account' })
      ).not.toBeNull();
      // ! Counted with `hidden: true`, not queried by name: the opened dialog marks everything else aria-hidden, and a drawer left open behind it then loses its accessible name too — a named query misses it and passes for the wrong reason.
      expect(screen.getAllByRole('dialog', { hidden: true })).toHaveLength(1);
    });

    it('closes and logs the user out', async () => {
      useAuthStore().setUser(buildUser());

      await renderSuspended(Default);

      const drawer = within(await openDrawer());

      await fireEvent.click(drawer.getByRole('button', { name: 'Logout' }));

      await waitFor(() => expect(requests.trace()).toContain('POST /logout'));
      expect(screen.queryByRole('dialog', { name: 'Menu' })).toBeNull();
    });

    it('closes when the route changes under it', async () => {
      useAuthStore().setUser(buildUser({ role: 'admin' }));

      await renderSuspended(Default);
      await openDrawer();

      await useRouter().push('/profile');

      await waitFor(() =>
        expect(screen.queryByRole('dialog', { name: 'Menu' })).toBeNull()
      );
    });
  });
});
