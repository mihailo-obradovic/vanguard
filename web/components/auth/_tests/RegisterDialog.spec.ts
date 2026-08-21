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

import RegisterDialog from '../RegisterDialog.vue';

import type { AuthDialog, User } from '@/types/auth';

async function mountDialog() {
  const closed: (User | AuthDialog | undefined)[] = [];

  const page = defineComponent({
    setup() {
      return () =>
        h(UApp, null, {
          default: () =>
            h(RegisterDialog, {
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

async function fillForm(email = 'new@example.com') {
  await fireEvent.update(field(/^name/i), 'New Person');
  await fireEvent.update(field(/^email/i), email);
  await fireEvent.update(field(/^password$/i), 'password123');
  await fireEvent.update(field(/confirmation/i), 'password123');

  // * Past the email availability rule's debounce, so $validate() has something settled to read.
  await new Promise((resolve) => setTimeout(resolve, 700));
}

function submit() {
  return fireEvent.submit(document.querySelector('form') as HTMLFormElement);
}

describe('RegisterDialog', () => {
  beforeEach(() => {
    server.use(...authHandlers());
  });

  afterEach(() => {
    cleanup();
  });

  it('resolves with the registered user', async () => {
    const user = buildUser({ email: 'new@example.com' });

    server.use(
      http.get(apiUrl('/api/user'), () => HttpResponse.json({ data: user }))
    );

    const { closed } = await mountDialog();

    await fillForm();
    await submit();

    await waitFor(() => expect(closed).toHaveLength(1));
    expect((closed[0] as User)?.email).toBe('new@example.com');
  });

  it("shows the server's 422 on the field rather than closing", async () => {
    server.use(
      http.post(apiUrl('/register'), () =>
        HttpResponse.json(
          {
            message: 'The given data was invalid.',
            errors: { email: ['The email has already been taken.'] }
          },
          { status: 422 }
        )
      )
    );

    const { closed } = await mountDialog();

    await fillForm();
    await submit();

    await waitFor(() =>
      expect(screen.getByText('The email has already been taken.')).toBeTruthy()
    );

    // ! And only on the field: the dialog suppresses the 422 toast the central handler would otherwise raise, so the verdict appears once rather than twice.
    await flushPromises();
    expect(
      screen.queryAllByText('The email has already been taken.')
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
