// @vitest-environment nuxt
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { h } from 'vue';
import { renderSuspended } from '@nuxt/test-utils/runtime';
import { screen, fireEvent, cleanup, waitFor } from '@testing-library/vue';
import { flushPromises } from '@vue/test-utils';

import { UApp } from '#components';

import { server } from '@/mocks/server';
import { userHandlers } from '@/mocks/handlers/user';
import { recordRequests } from '@/mocks/requests';
import { buildUser } from '@/mocks/fixtures';

import DeleteUserDialog from '../DeleteUserDialog.vue';

const requests = recordRequests();

const DELETE_7 = 'DELETE /api/users/7';

const ADA = buildUser({ id: 7, name: 'Ada' });

/** Mount the dialog the way `useOverlay` does — already open, with its subject as a prop. */
async function mountDialog() {
  const closed: (true | undefined)[] = [];

  await renderSuspended({
    setup: () => () =>
      h(UApp, null, {
        default: () =>
          h(DeleteUserDialog, {
            open: true,
            user: ADA,
            onClose: (deleted?: true) => closed.push(deleted)
          })
      })
  });

  return { closed };
}

function button(name: RegExp) {
  return screen.getByRole('button', { name });
}

describe('DeleteUserDialog', () => {
  beforeEach(() => {
    requests.reset();
    server.use(...userHandlers());
  });

  afterEach(async () => {
    await flushPromises();
    cleanup();
  });

  it('names the user it is about to delete', async () => {
    await mountDialog();

    expect(screen.getByText(/Ada/)).toBeTruthy();
  });

  // ! The dialog owns the mutation, so the delete is only observable on the wire — and it must
  // ! carry the subject's own id, not whichever row happened to be rendered last.
  it('deletes the user it was opened on', async () => {
    await mountDialog();

    await fireEvent.click(button(/delete/i));

    await requests.settle();

    expect(requests.trace()).toContain(DELETE_7);
  });

  it('resolves as deleted so the opener knows it happened', async () => {
    const { closed } = await mountDialog();

    await fireEvent.click(button(/delete/i));

    await waitFor(() => expect(closed.length).toBe(1));
    expect(closed[0]).toBe(true);
  });

  // ! Dismissing through the modal's own chrome goes through a different path than the cancel button: the overlay reports the close and the dialog has to forward it, or the opener is left holding a promise that never settles and the overlay never unmounts.
  it('resolves when the modal itself is dismissed', async () => {
    const { closed } = await mountDialog();

    await fireEvent.keyDown(document.body, { key: 'Escape' });

    await waitFor(() => expect(closed.length).toBe(1));
    expect(closed[0]).toBeUndefined();
    expect(requests.trace()).not.toContain(DELETE_7);
  });

  it('sends nothing when the delete is called off', async () => {
    const { closed } = await mountDialog();

    await fireEvent.click(button(/cancel/i));

    await requests.settle();

    expect(requests.trace()).not.toContain(DELETE_7);
    expect(closed[0]).toBeUndefined();
  });
});
