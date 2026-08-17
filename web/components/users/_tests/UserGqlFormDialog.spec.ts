// @vitest-environment nuxt
import { describe, it, expect, afterEach } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { renderSuspended } from '@nuxt/test-utils/runtime';
import { screen, fireEvent, cleanup, waitFor } from '@testing-library/vue';

import { buildUser } from '@/mocks/fixtures';

import UserGqlFormDialog from '../UserGqlFormDialog.vue';

import type { User } from '@/types/auth';
import type { UpdateUserGqlInput } from '@/types/user';

/**
 * Mount the dialog with reactive props, the way the demo page owns them.
 *
 * * No MSW handler needed, unlike the REST form's: this form mirrors the GraphQL validator, which
 * * has no availability check, so nothing leaves the app while the user types.
 */
async function mountDialog(user: User | null) {
  const subject = ref<User | null>(user);
  const serverErrors = ref<Record<string, string[]>>({});
  const updates: UpdateUserGqlInput[] = [];
  const closes: true[] = [];

  const page = defineComponent({
    setup() {
      return () =>
        h(UserGqlFormDialog, {
          user: subject.value,
          submitting: false,
          serverErrors: serverErrors.value,
          onUpdate: (input: UpdateUserGqlInput) => updates.push(input),
          onClose: () => closes.push(true)
        });
    }
  });

  await renderSuspended(page);

  return { subject, serverErrors, updates, closes };
}

function field(label: string) {
  return screen.getByLabelText(label) as HTMLInputElement;
}

function submit() {
  return fireEvent.submit(document.querySelector('form') as HTMLFormElement);
}

/**
 * Long enough for a pending `$validate()` to have resolved.
 *
 * ! Asserting an absence right after the error message renders proves nothing: the message appears
 * ! while `$validate()` is still settling, so an emit that should not happen has not had its
 * ! chance yet. The mutation audit caught exactly that.
 */
function settleValidation() {
  return new Promise((resolve) => setTimeout(resolve, 300));
}

describe('UserGqlFormDialog', () => {
  afterEach(() => {
    cleanup();
  });

  // ! The subject is the open state here — one fact, one prop. A separate flag could disagree with it.
  it('stays closed while there is no user to edit', async () => {
    await mountDialog(null);

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens on the user it is given, named in the title', async () => {
    await mountDialog(
      buildUser({ id: 7, name: 'Ada', email: 'ada@example.com' })
    );

    expect(screen.getByRole('dialog', { name: 'Edit Ada' })).toBeTruthy();
    expect(field('Name').value).toBe('Ada');
    expect(field('Email').value).toBe('ada@example.com');
  });

  // ! The partial-update contract: an omitted GraphQL variable never reaches the resolver, so
  // ! sending only the diff is what stops two editors overwriting each other with stale snapshots.
  it('sends only the fields that actually changed', async () => {
    const { updates } = await mountDialog(
      buildUser({ id: 7, name: 'Ada', email: 'ada@example.com', role: 'user' })
    );

    await fireEvent.update(field('Name'), 'Ada Lovelace');

    await submit();

    await waitFor(() => expect(updates).toHaveLength(1));
    expect(updates[0]).toEqual({ id: 7, name: 'Ada Lovelace' });
  });

  it('sends the id alone when nothing was touched', async () => {
    const { updates } = await mountDialog(buildUser({ id: 7, name: 'Ada' }));

    await submit();

    await waitFor(() => expect(updates).toHaveLength(1));
    expect(updates[0]).toEqual({ id: 7 });
  });

  it('sends a changed role', async () => {
    const { updates } = await mountDialog(
      buildUser({ id: 7, name: 'Ada', role: 'user' })
    );

    await fireEvent.update(screen.getByLabelText('Role'), 'admin');

    await submit();

    await waitFor(() => expect(updates).toHaveLength(1));
    expect(updates[0]).toEqual({ id: 7, role: 'admin' });
  });

  // ! Opening on the next subject rather than the last is what keeps the title and the fields
  // ! describing the same person.
  it('re-seeds on the next subject', async () => {
    const { subject } = await mountDialog(buildUser({ id: 1, name: 'Ada' }));

    await fireEvent.update(field('Name'), 'abandoned edit');

    subject.value = null;
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    subject.value = buildUser({ id: 2, name: 'Grace' });

    await waitFor(() => expect(field('Name').value).toBe('Grace'));
    expect(screen.getByRole('dialog', { name: 'Edit Grace' })).toBeTruthy();
  });

  it('does not emit an update the rules reject', async () => {
    const { updates } = await mountDialog(buildUser({ id: 7, name: 'Ada' }));

    await fireEvent.update(field('Email'), 'not-an-email');

    await submit();

    await waitFor(() =>
      expect(
        screen.getByText('The email field must be a valid email address.')
      ).toBeTruthy()
    );

    await settleValidation();

    expect(updates).toHaveLength(0);
  });

  it('names the field when the name is emptied', async () => {
    const { updates } = await mountDialog(buildUser({ id: 7, name: 'Ada' }));

    await fireEvent.update(field('Name'), '');

    await submit();

    await waitFor(() =>
      expect(screen.getByText('The name field is required.')).toBeTruthy()
    );

    await settleValidation();

    expect(updates).toHaveLength(0);
  });

  it('renders the server verdict on the field it names', async () => {
    const { serverErrors, updates } = await mountDialog(
      buildUser({ id: 7, name: 'Ada' })
    );

    await submit();
    await waitFor(() => expect(updates).toHaveLength(1));

    serverErrors.value = { email: ['The email has already been taken.'] };

    await waitFor(() =>
      expect(screen.getByText('The email has already been taken.')).toBeTruthy()
    );
  });

  // * Escape is UIDialog's, but the page only hears about it because this dialog forwards it.
  it("forwards the dialog's own close request", async () => {
    const { closes } = await mountDialog(buildUser({ id: 7 }));

    await fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(closes).toHaveLength(1);
  });

  it('asks to close when Cancel is pressed', async () => {
    const { closes } = await mountDialog(buildUser({ id: 7 }));

    await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(closes).toHaveLength(1);
  });
});
