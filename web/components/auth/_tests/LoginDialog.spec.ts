// @vitest-environment nuxt
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { defineComponent, h } from 'vue';
import { renderSuspended } from '@nuxt/test-utils/runtime';
import { http, HttpResponse } from 'msw';
import { screen, fireEvent, cleanup, waitFor } from '@testing-library/vue';
import { flushPromises } from '@vue/test-utils';

import { UApp } from '#components';

import { server } from '@/mocks/server';
import { apiUrl } from '@/mocks/api';
import { authHandlers } from '@/mocks/handlers/auth';
import { buildUser } from '@/mocks/fixtures';

import LoginDialog from '../LoginDialog.vue';

import type { AuthDialog, User } from '@/types/auth';

// * `<u-modal>` needs `<UApp>` above it for its overlay provider, so the harness supplies one.
async function mountDialog() {
  const closed: (User | AuthDialog | undefined)[] = [];

  const page = defineComponent({
    setup() {
      return () =>
        h(UApp, null, {
          default: () =>
            h(LoginDialog, {
              open: true,
              onClose: (result?: User | AuthDialog) => closed.push(result)
            })
        });
    }
  });

  await renderSuspended(page);

  return { closed };
}

function field(label: string | RegExp) {
  return screen.getByLabelText(label) as HTMLInputElement;
}

function submit() {
  return fireEvent.submit(document.querySelector('form') as HTMLFormElement);
}

async function fillCredentials(email = 'test@example.com') {
  await fireEvent.update(field(/email/i), email);
  await fireEvent.update(field(/password/i), 'password123');
}

describe('LoginDialog', () => {
  beforeEach(() => {
    server.use(...authHandlers());
  });

  afterEach(() => {
    cleanup();
  });

  it('resolves with the signed-in user once the request succeeds', async () => {
    const user = buildUser({ email: 'test@example.com' });

    server.use(
      http.get(apiUrl('/api/user'), () => HttpResponse.json({ data: user }))
    );

    const { closed } = await mountDialog();

    await fillCredentials();
    await submit();

    await waitFor(() => expect(closed).toHaveLength(1));
    expect((closed[0] as User)?.email).toBe('test@example.com');
  });

  it('does not submit while the form is invalid', async () => {
    const { closed } = await mountDialog();

    // * The dialog opens prefilled, so emptying the email is what makes it invalid.
    await fireEvent.update(field(/email/i), '');
    await fireEvent.update(field(/password/i), 'password123');
    await submit();

    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(closed).toHaveLength(0);
  });

  it("shows the server's 422 on the field rather than closing", async () => {
    server.use(
      http.post(apiUrl('/login'), () =>
        HttpResponse.json(
          {
            message: 'The given data was invalid.',
            errors: { email: ['These credentials do not match our records.'] }
          },
          { status: 422 }
        )
      )
    );

    const { closed } = await mountDialog();

    await fillCredentials();
    await submit();

    await waitFor(() =>
      expect(
        screen.getByText('These credentials do not match our records.')
      ).toBeTruthy()
    );

    // ! And only on the field: the dialog suppresses the 422 toast the central handler would otherwise raise, so the verdict appears once rather than twice.
    await flushPromises();
    expect(
      screen.queryAllByText('These credentials do not match our records.')
    ).toHaveLength(1);

    expect(closed).toHaveLength(0);
  });

  it('resolves with nothing when dismissed', async () => {
    const { closed } = await mountDialog();

    await fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() => expect(closed).toHaveLength(1));
    expect(closed[0]).toBeUndefined();
  });

  // ! Dismissing through the modal's own chrome is a different path than the footer's links, and it has to resolve with nothing rather than a dialog name — an opener that read a dismissal as a switch request would reopen the pair forever.
  it('resolves with nothing when the modal itself is dismissed', async () => {
    const { closed } = await mountDialog();

    await fireEvent.keyDown(document.body, { key: 'Escape' });

    await waitFor(() => expect(closed).toHaveLength(1));
    expect(closed[0]).toBeUndefined();
  });
});
