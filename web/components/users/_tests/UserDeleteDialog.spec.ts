// @vitest-environment nuxt
import { describe, it, expect, afterEach } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import {
  screen,
  fireEvent,
  cleanup,
  waitFor,
  within
} from '@testing-library/vue';

import { buildUser } from '@/mocks/fixtures';

import UserDeleteDialog from '../UserDeleteDialog.vue';

import type { User } from '@/types/auth';

/** Mount the dialog with reactive props and record its emits, the way the users page owns it. */
async function mountDialog(
  user: User | null = buildUser({ id: 7, name: 'Ada' })
) {
  const subject = ref<User | null>(user);
  const deleting = ref(false);
  const emitted = { confirm: [] as number[], close: 0 };

  const page = defineComponent({
    setup() {
      return () =>
        h(UserDeleteDialog, {
          user: subject.value,
          deleting: deleting.value,
          onConfirm: (id: number) => emitted.confirm.push(id),
          onClose: () => emitted.close++
        });
    }
  });

  await mountSuspended(page);

  return { subject, deleting, emitted };
}

function confirmation() {
  return within(screen.getByRole('alertdialog'));
}

describe('UserDeleteDialog', () => {
  afterEach(() => {
    cleanup();
    document.body.replaceChildren();
  });

  it('stays closed without a user to delete', async () => {
    await mountDialog(null);

    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('names the user it is about to delete', async () => {
    await mountDialog();

    expect(confirmation().getByText('"Ada"')).not.toBeNull();
  });

  // ! The regression. The confirm button was Reka's AlertDialogAction — a DialogClose — which closed the dialog before its click listener ran; the page cleared its subject on that close, and the delete found nothing to send. Confirming must ask for the delete and leave closing to the owner.
  it('asks for the delete and stays open until the owner closes it', async () => {
    const { emitted } = await mountDialog();

    await fireEvent.click(
      confirmation().getByRole('button', { name: 'Delete User' })
    );

    expect(emitted.confirm).toEqual([7]);
    expect(emitted.close).toBe(0);
    expect(screen.getByRole('alertdialog')).not.toBeNull();
  });

  it('asks to close when Cancel is pressed', async () => {
    const { emitted } = await mountDialog();

    await fireEvent.click(
      confirmation().getByRole('button', { name: 'Cancel' })
    );

    expect(emitted.close).toBe(1);
    expect(emitted.confirm).toEqual([]);
  });

  it('cannot be dismissed while the delete is in flight', async () => {
    const { deleting, emitted } = await mountDialog();

    deleting.value = true;
    await nextTick();

    const dialog = screen.getByRole('alertdialog');

    expect(
      (
        within(dialog).getByRole('button', {
          name: 'Cancel'
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true);

    await fireEvent.keyDown(dialog, { key: 'Escape' });

    expect(emitted.close).toBe(0);
    expect(screen.getByRole('alertdialog')).not.toBeNull();
  });

  // * The opener survives a cancel, so focus goes back to it — the fallback is only for a row the delete removed. Focus-then-click is how a keyboard user opens it; a bare click never moves focus.
  it('returns focus to the row button it was opened from when cancelled', async () => {
    const subject = ref<User | null>(null);

    const page = defineComponent({
      setup() {
        return () => [
          h(
            'button',
            { onClick: () => (subject.value = buildUser({ id: 7 })) },
            'Delete Ada'
          ),
          h(UserDeleteDialog, {
            user: subject.value,
            deleting: false,
            onClose: () => (subject.value = null)
          })
        ];
      }
    });

    // ! Attached: the opener is page content, not teleported, and focus only moves inside a document.
    await mountSuspended(page, { attachTo: document.body });

    const opener = screen.getByRole('button', { name: 'Delete Ada' });

    opener.focus();
    await fireEvent.click(opener);
    await fireEvent.click(
      confirmation().getByRole('button', { name: 'Cancel' })
    );

    await waitFor(() =>
      expect(screen.queryByRole('alertdialog', { hidden: true })).toBeNull()
    );
    await waitFor(() => expect(document.activeElement).toBe(opener));
  });

  // * A confirmed delete removes the row the dialog was opened from, so there is nothing to return to; the page's main landmark takes focus instead of <body>.
  it('sends focus to the main landmark once the deleted row is gone', async () => {
    const subject = ref<User | null>(null);
    const rowPresent = ref(true);

    const page = defineComponent({
      setup() {
        return () =>
          h('main', { id: 'main-content', tabindex: -1 }, [
            rowPresent.value
              ? h(
                  'button',
                  { onClick: () => (subject.value = buildUser({ id: 7 })) },
                  'Delete Ada'
                )
              : null,
            h(UserDeleteDialog, {
              user: subject.value,
              deleting: false,
              onConfirm: () => {
                rowPresent.value = false;
                subject.value = null;
              }
            })
          ]);
      }
    });

    await mountSuspended(page, { attachTo: document.body });

    const opener = screen.getByRole('button', { name: 'Delete Ada' });

    opener.focus();
    await fireEvent.click(opener);
    await fireEvent.click(
      confirmation().getByRole('button', { name: 'Delete User' })
    );

    await waitFor(() =>
      expect(screen.queryByRole('alertdialog', { hidden: true })).toBeNull()
    );
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole('main'))
    );
  });
});
