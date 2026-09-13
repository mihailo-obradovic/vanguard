// @vitest-environment nuxt
import { describe, it, expect, afterEach } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { screen, fireEvent, cleanup, within } from '@testing-library/vue';

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
});
