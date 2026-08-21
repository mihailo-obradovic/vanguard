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

import ForgotPasswordDialog from '../ForgotPasswordDialog.vue';

import type { AuthDialog } from '@/types/auth';

async function mountDialog() {
  const closed: (AuthDialog | undefined)[] = [];

  const page = defineComponent({
    setup() {
      return () =>
        h(UApp, null, {
          default: () =>
            h(ForgotPasswordDialog, {
              open: true,
              onClose: (result?: AuthDialog) => closed.push(result)
            })
        });
    }
  });

  await renderSuspended(page);

  return { closed };
}

function submit() {
  return fireEvent.submit(document.querySelector('form') as HTMLFormElement);
}

describe('ForgotPasswordDialog', () => {
  beforeEach(() => {
    server.use(...authHandlers());
  });

  afterEach(() => {
    cleanup();
  });

  it('closes once the reset link is on its way, passing on what the server said', async () => {
    const { closed } = await mountDialog();

    await fireEvent.update(screen.getByLabelText(/email/i), 'test@example.com');
    await submit();

    await waitFor(() => expect(closed).toHaveLength(1));
    expect(closed[0]).toBeUndefined();
    expect(
      await screen.findAllByText('We have emailed your password reset link.')
    ).not.toHaveLength(0);
  });

  it("shows the server's 422 on the field rather than closing", async () => {
    server.use(
      http.post(apiUrl('/forgot-password'), () =>
        HttpResponse.json(
          {
            message: 'The given data was invalid.',
            errors: { email: ["We can't find a user with that email."] }
          },
          { status: 422 }
        )
      )
    );

    const { closed } = await mountDialog();

    await fireEvent.update(
      screen.getByLabelText(/email/i),
      'nobody@example.com'
    );
    await submit();

    await waitFor(() =>
      expect(
        screen.getByText("We can't find a user with that email.")
      ).toBeTruthy()
    );

    // ! And only on the field: the dialog suppresses the 422 toast the central handler would otherwise raise, so the verdict appears once rather than twice.
    await flushPromises();
    expect(
      screen.queryAllByText("We can't find a user with that email.")
    ).toHaveLength(1);

    expect(closed).toHaveLength(0);
  });

  it('asks for the login dialog instead of finishing', async () => {
    const { closed } = await mountDialog();

    await fireEvent.click(screen.getByRole('button', { name: /login here/i }));

    await waitFor(() => expect(closed).toHaveLength(1));
    expect(closed[0]).toBe('login');
  });

  // ! Dismissing through the modal's own chrome is a different path than the footer's links, and it has to resolve with nothing rather than a dialog name — an opener that read a dismissal as a switch request would reopen the pair forever.
  it('resolves with nothing when the modal itself is dismissed', async () => {
    const { closed } = await mountDialog();

    await fireEvent.keyDown(document.body, { key: 'Escape' });

    await waitFor(() => expect(closed).toHaveLength(1));
    expect(closed[0]).toBeUndefined();
  });
});
