// @vitest-environment nuxt
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderSuspended } from '@nuxt/test-utils/runtime';
import { screen, fireEvent, cleanup, waitFor } from '@testing-library/vue';
import { createVuetify } from 'vuetify';
import { defineComponent, nextTick, reactive } from 'vue';

import { buildUser } from '@/mocks/fixtures';

import UserFormDialog from '../UserFormDialog.vue';

import type { User } from '@/types/auth';
import type { CreateUserForm } from '@/types/user';

// ! happy-dom has no `visualViewport`, and Vuetify's overlay positioning reaches for it as a bare
// ! global — optional chaining does not save an *undeclared* name from a ReferenceError.
vi.stubGlobal('visualViewport', null);

const ANA = buildUser({
  id: 1,
  name: 'Ana',
  email: 'ana@example.com',
  role: 'admin'
});

/**
 * The dialog's props change between one opening and the next — that is the whole contract under
 * test — and `rerender` does not reach through `renderSuspended`'s wrapper, so an owner holds
 * them in a reactive object the test drives directly.
 */
const owner = reactive<{
  open: boolean;
  editMode: boolean;
  user: User | null;
  serverErrors: Record<string, string[]>;
}>({ open: false, editMode: false, user: null, serverErrors: {} });

const confirmed: CreateUserForm[] = [];

const AnOwnedFormDialog = defineComponent({
  // ! Only `components/_shared` is auto-imported (`components.dirs`), so this one is registered by hand.
  components: { UserFormDialog },
  setup() {
    return { owner, onConfirm: (form: CreateUserForm) => confirmed.push(form) };
  },
  template: `
    <UserFormDialog
      v-model="owner.open"
      :edit-mode="owner.editMode"
      :user="owner.user"
      :server-errors="owner.serverErrors"
      @confirm="onConfirm"
    />
  `
});

/** Vuetify needs supplying by hand — `renderSuspended` does not run the Nuxt plugin that installs it. */
function renderOwner() {
  return renderSuspended(AnOwnedFormDialog, {
    global: { plugins: [createVuetify()] }
  });
}

/** Open the dialog the way its owner does: set the mode and the subject, then the flag. */
async function open(state: Partial<typeof owner> = {}) {
  Object.assign(owner, state, { open: true });

  await nextTick();
  await waitFor(() => expect(screen.getByLabelText(/^Name$/)).toBeTruthy());
}

/** Everything the create form needs to pass its own rules. */
async function fillInAValidUser() {
  await fireEvent.update(field(/^Name$/), 'Bob');
  await fireEvent.update(field(/^Email$/), 'bob@example.com');
  await fireEvent.update(field(/^Password$/), 'hunter2hunter2');
  await fireEvent.update(field(/^Password Confirmation$/), 'hunter2hunter2');
}

/** A 422 comes back after a submit, so the errors arrive while the dialog is already open. */
async function failWith(serverErrors: Record<string, string[]>) {
  owner.serverErrors = serverErrors;

  await nextTick();
}

async function close() {
  owner.open = false;

  await nextTick();
}

function field(label: RegExp) {
  return screen.getByLabelText(label) as HTMLInputElement;
}

describe('UserFormDialog', () => {
  beforeEach(() => {
    Object.assign(owner, {
      open: false,
      editMode: false,
      user: null,
      serverErrors: {}
    });
    confirmed.length = 0;
  });

  afterEach(() => {
    cleanup();
    // ! The dialog teleports to body, outside the container `cleanup` owns.
    document.body.innerHTML = '';
  });

  it('opens blank to create a user', async () => {
    await renderOwner();
    await open();

    expect(screen.getByText('Create New User')).toBeTruthy();
    expect(field(/^Name$/).value).toBe('');
    expect(field(/^Email$/).value).toBe('');
  });

  it('opens on the user being edited, filled in', async () => {
    await renderOwner();
    await open({ editMode: true, user: ANA });

    expect(screen.getByText('Edit User')).toBeTruthy();
    expect(field(/^Name$/).value).toBe('Ana');
    expect(field(/^Email$/).value).toBe('ana@example.com');
  });

  // ! This is what the reset-on-open watcher exists for. Resetting after the close transition
  // ! instead would read `editMode` and `user` while they still describe the session just closed,
  // ! so the next create would open holding the last edited user's details.
  it('opens blank again after an edit', async () => {
    await renderOwner();

    await open({ editMode: true, user: ANA });
    await close();
    await open({ editMode: false, user: null });

    expect(field(/^Name$/).value).toBe('');
    expect(field(/^Email$/).value).toBe('');
  });

  it('forgets what the user typed into the previous session', async () => {
    await renderOwner();

    await open();
    await fireEvent.update(field(/^Name$/), 'Half-finished');
    await close();
    await open();

    expect(field(/^Name$/).value).toBe('');
  });

  // ! The 422 only reaches the field once the submit has marked it dirty — Regle keeps `$errors`
  // ! empty for an untouched field, external errors included. That is why this walks the real
  // ! sequence (fill, submit, server refuses) rather than just setting the prop.
  it('shows the server’s complaint against the field it names', async () => {
    await renderOwner();
    await open();

    await fillInAValidUser();
    await fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    await failWith({ email: ['That email is already taken.'] });

    expect(
      await screen.findByText('That email is already taken.')
    ).toBeTruthy();
  });

  it('clears the previous session’s server errors on reopening', async () => {
    await renderOwner();

    await open();
    await fillInAValidUser();
    await fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    await failWith({ email: ['That email is already taken.'] });
    await screen.findByText('That email is already taken.');
    await close();

    // * The owner still holds the failed mutation's error — the dialog clears it on open anyway.
    await open();

    await waitFor(() =>
      expect(screen.queryByText('That email is already taken.')).toBeNull()
    );
  });

  it('reports the completed form to its owner', async () => {
    await renderOwner();
    await open();

    await fireEvent.update(field(/^Name$/), 'Bob');
    await fireEvent.update(field(/^Email$/), 'bob@example.com');
    await fireEvent.update(field(/^Password$/), 'hunter2hunter2');
    await fireEvent.update(field(/^Password Confirmation$/), 'hunter2hunter2');

    await fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(confirmed).toHaveLength(1));
    expect(confirmed[0]).toMatchObject({
      name: 'Bob',
      email: 'bob@example.com',
      password: 'hunter2hunter2',
      role: 'user'
    });
  });

  it('keeps an incomplete form to itself', async () => {
    await renderOwner();
    await open();

    await fireEvent.update(field(/^Name$/), 'Bob');
    await fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() =>
      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0)
    );
    expect(confirmed).toHaveLength(0);
  });

  // ! Create requires a password; edit only validates one the user actually typed. The rules are a
  // ! getter for exactly this reason — the same dialog instance serves both modes.
  it('lets an edit go through without touching the password', async () => {
    await renderOwner();
    await open({ editMode: true, user: ANA });

    await fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(confirmed).toHaveLength(1));
    expect(confirmed[0]).toMatchObject({
      name: 'Ana',
      email: 'ana@example.com',
      password: '',
      role: 'admin'
    });
  });

  it('holds an edit back when only half a new password was typed', async () => {
    await renderOwner();
    await open({ editMode: true, user: ANA });

    await fireEvent.update(field(/^New password/), 'hunter2hunter2');
    await fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() =>
      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0)
    );
    expect(confirmed).toHaveLength(0);
  });
});
