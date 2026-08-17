// @vitest-environment nuxt
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { renderSuspended } from '@nuxt/test-utils/runtime';
import { http, HttpResponse } from 'msw';
import { screen, fireEvent, cleanup, waitFor } from '@testing-library/vue';

import { server } from '@/mocks/server';
import { apiUrl } from '@/mocks/api';
import { buildUser } from '@/mocks/fixtures';

import UserFormDialog from '../UserFormDialog.vue';

import type { User } from '@/types/auth';
import type { CreateUserForm, UpdateUserForm } from '@/types/user';

type Emitted = {
  create: CreateUserForm[];
  update: [number, UpdateUserForm][];
  close: true[];
};

/**
 * Mount the dialog with reactive props, the way the page owns them.
 *
 * * The email field carries the debounced availability rule, so every spec needs the endpoint
 * * answered — otherwise the request fails the run as unhandled.
 */
async function mountDialog(user: User | null = null) {
  const open = ref(true);
  const subject = ref<User | null>(user);
  const serverErrors = ref<Record<string, string[]>>({});
  const emitted: Emitted = { create: [], update: [], close: [] };

  const page = defineComponent({
    setup() {
      return () =>
        h(UserFormDialog, {
          open: open.value,
          user: subject.value,
          submitting: false,
          serverErrors: serverErrors.value,
          onCreate: (payload: CreateUserForm) => emitted.create.push(payload),
          onUpdate: (id: number, payload: UpdateUserForm) =>
            emitted.update.push([id, payload]),
          onClose: () => emitted.close.push(true)
        });
    }
  });

  await renderSuspended(page);

  return { open, subject, serverErrors, emitted };
}

function field(label: string) {
  return screen.getByLabelText(label) as HTMLInputElement;
}

/**
 * Submit the form itself rather than clicking the button.
 *
 * ! The submit button is disabled while `r$.$invalid`, and the debounced availability rule keeps a
 * ! freshly filled form invalid for 500ms — clicking would silently do nothing and the assertion
 * ! would read as a missing emit. Submitting exercises the handler's own guard, which awaits the
 * ! async rules; the disabled button gets its own case.
 */
function submit() {
  return fireEvent.submit(document.querySelector('form') as HTMLFormElement);
}

/**
 * Submit and wait for the emit that follows validation.
 *
 * ! Leaving `$validate()` pending across the end of a test unmounts the form under it, and Regle
 * ! rejects into an unhandled rejection that fails the whole run without failing a test (tracker
 * ! item: "Regle $validate rejects after unmount"). A spec that submits must wait for the outcome.
 */
async function submitAndSettle(emitted: Emitted) {
  await submit();

  await waitFor(() =>
    expect(emitted.create.length + emitted.update.length).toBe(1)
  );
}

/** Past the email field's 500ms debounce, so a pending `$validate()` has resolved. */
function settleValidation() {
  return new Promise((resolve) => setTimeout(resolve, 700));
}

async function fillValidCreation() {
  await fireEvent.update(field('Name'), 'Ada');
  await fireEvent.update(field('Email'), 'ada@example.com');
  await fireEvent.update(field('Password'), 'gmaz1234');
  await fireEvent.update(field('Password confirmation'), 'gmaz1234');
}

describe('UserFormDialog', () => {
  beforeEach(() => {
    server.use(
      http.get(apiUrl('/api/email-availability'), () =>
        HttpResponse.json({ available: true })
      )
    );
  });

  afterEach(() => {
    cleanup();
  });

  it('opens blank when there is no user to edit', async () => {
    await mountDialog();

    expect(field('Name').value).toBe('');
    expect(field('Email').value).toBe('');
    expect(screen.getByRole('button', { name: 'Create User' })).toBeTruthy();
  });

  it('seeds itself from the user it was opened on', async () => {
    await mountDialog(
      buildUser({ id: 7, name: 'Ada', email: 'ada@example.com', role: 'admin' })
    );

    expect(field('Name').value).toBe('Ada');
    expect(field('Email').value).toBe('ada@example.com');
    expect((screen.getByLabelText('Role') as HTMLSelectElement).value).toBe(
      'admin'
    );
    expect(screen.getByRole('button', { name: 'Update User' })).toBeTruthy();
  });

  // ! Re-seeding on open is the whole reason the reset lives there: without it the dialog shows the
  // ! previous subject's values, or an admin's half-typed edit, the next time it is opened.
  it('re-seeds on the next subject rather than keeping the last one', async () => {
    const { open, subject } = await mountDialog(
      buildUser({ id: 1, name: 'Ada' })
    );

    await fireEvent.update(field('Name'), 'edited but abandoned');

    open.value = false;
    await waitFor(() => expect(screen.queryByLabelText('Name')).toBeNull());

    subject.value = buildUser({ id: 2, name: 'Grace' });
    open.value = true;

    await waitFor(() => expect(field('Name').value).toBe('Grace'));
  });

  it('emits the whole form as a creation when there is no subject', async () => {
    const { emitted } = await mountDialog();

    await fillValidCreation();

    await submit();

    await waitFor(() => expect(emitted.create).toHaveLength(1));
    expect(emitted.create[0]).toEqual({
      name: 'Ada',
      email: 'ada@example.com',
      password: 'gmaz1234',
      password_confirmation: 'gmaz1234',
      role: 'user'
    });
  });

  // ! The rule this pins is the backend's: a present password reads as a change request, and a
  // ! present-but-empty one is rejected outright. An untouched pair must not travel.
  it('leaves the password pair out of an update that did not set one', async () => {
    const { emitted } = await mountDialog(
      buildUser({ id: 7, name: 'Ada', email: 'ada@example.com' })
    );

    await fireEvent.update(field('Name'), 'Ada Lovelace');

    await submit();

    await waitFor(() => expect(emitted.update).toHaveLength(1));
    expect(emitted.update[0]).toEqual([
      7,
      { name: 'Ada Lovelace', email: 'ada@example.com', role: 'user' }
    ]);
  });

  it('sends the password pair on an update that set one', async () => {
    const { emitted } = await mountDialog(
      buildUser({ id: 7, name: 'Ada', email: 'ada@example.com' })
    );

    await fireEvent.update(
      field('Password (leave empty to keep current)'),
      'gmaz1234'
    );
    await fireEvent.update(
      field('Password confirmation (required if changing password)'),
      'gmaz1234'
    );

    await submit();

    await waitFor(() => expect(emitted.update).toHaveLength(1));
    expect(emitted.update[0]?.[1]).toEqual({
      name: 'Ada',
      email: 'ada@example.com',
      role: 'user',
      password: 'gmaz1234',
      password_confirmation: 'gmaz1234'
    });
  });

  // ! The role is the one field with privilege attached: an admin created as a user (or the other
  // ! way round) is a silent authorization bug, not a cosmetic one.
  it('creates the role that was picked', async () => {
    const { emitted } = await mountDialog();

    await fillValidCreation();
    await fireEvent.update(screen.getByLabelText('Role'), 'admin');

    await submitAndSettle(emitted);

    expect(emitted.create[0]?.role).toBe('admin');
  });

  it('carries a changed role on an update', async () => {
    const { emitted } = await mountDialog(
      buildUser({ id: 7, name: 'Ada', email: 'ada@example.com', role: 'user' })
    );

    await fireEvent.update(screen.getByLabelText('Role'), 'admin');

    await submitAndSettle(emitted);

    expect(emitted.update[0]?.[1].role).toBe('admin');
  });

  it('does not emit anything for a form the rules reject', async () => {
    const { emitted } = await mountDialog();

    await fireEvent.update(field('Name'), 'Ada');
    await fireEvent.update(field('Email'), 'not-an-email');

    await submit();

    await waitFor(() =>
      expect(
        screen.getByText('The email field must be a valid email address.')
      ).toBeTruthy()
    );

    // ! An absence needs a window. The email field debounces 500ms, so `$validate()` settles well
    // ! after the format message renders — asserting on the emit right here passes even with the
    // ! guard deleted, which is exactly what the mutation audit caught.
    await settleValidation();

    expect(emitted.create).toHaveLength(0);
  });

  it('names the field when the name is left empty', async () => {
    const { emitted } = await mountDialog();

    await fireEvent.update(field('Email'), 'ada@example.com');

    await submit();

    await waitFor(() =>
      expect(screen.getByText('The name field is required.')).toBeTruthy()
    );

    await settleValidation();

    expect(emitted.create).toHaveLength(0);
  });

  // ! Without the id, editing a user and keeping their own address reads as "already taken".
  it('excludes the user being edited from the availability check', async () => {
    const asked: (string | null)[] = [];

    server.use(
      http.get(apiUrl('/api/email-availability'), ({ request }) => {
        asked.push(new URL(request.url).searchParams.get('ignore_id'));

        return HttpResponse.json({ available: true });
      })
    );

    await mountDialog(buildUser({ id: 7, email: 'ada@example.com' }));

    await fireEvent.update(field('Email'), 'ada@example.com');

    await waitFor(() => expect(asked).toHaveLength(1));
    expect(asked[0]).toBe('7');
  });

  it('titles itself for the mode it is in', async () => {
    const { subject } = await mountDialog();

    expect(
      screen.getByRole('dialog', { name: 'Create New User' })
    ).toBeTruthy();

    subject.value = buildUser({ id: 7 });

    await waitFor(() =>
      expect(screen.getByRole('dialog', { name: 'Edit User' })).toBeTruthy()
    );
  });

  it('renders the server verdict on the field it names', async () => {
    const { serverErrors, emitted } = await mountDialog();

    await fillValidCreation();
    await submitAndSettle(emitted);

    serverErrors.value = { email: ['The email has already been taken.'] };

    await waitFor(() =>
      expect(screen.getByText('The email has already been taken.')).toBeTruthy()
    );
  });

  // ! Reopening has to clear the last attempt's server errors too, or a fresh form opens already
  // ! carrying a verdict about a value that is no longer in it.
  it('clears a server error when it is reopened', async () => {
    const { open, serverErrors, emitted } = await mountDialog();

    await fillValidCreation();
    await submitAndSettle(emitted);

    serverErrors.value = { email: ['The email has already been taken.'] };
    await waitFor(() =>
      expect(screen.getByText('The email has already been taken.')).toBeTruthy()
    );

    open.value = false;
    await waitFor(() => expect(screen.queryByLabelText('Name')).toBeNull());

    // * `serverErrors` deliberately still holds the 422: the page's mutation error ref does not
    // * clear until the next request, so clearing the display is the dialog's own job.
    open.value = true;

    await waitFor(() => expect(field('Name')).toBeTruthy());
    expect(screen.queryByText('The email has already been taken.')).toBeNull();
  });

  // * The button is the user's signal that the form is not ready; the handler's guard above is the
  // * one that actually refuses. Both exist, so both are pinned.
  it('offers no enabled submit until the rules pass', async () => {
    await mountDialog();

    const button = screen.getByRole('button', { name: 'Create User' });

    expect((button as HTMLButtonElement).disabled).toBe(true);

    await fillValidCreation();

    await waitFor(() =>
      expect((button as HTMLButtonElement).disabled).toBe(false)
    );
  });

  // ! The reason `clearExternalErrors` is set: resetting the values alone only HIDES the stale
  // ! verdict, because Regle keeps errors off a pristine field. Left in the ref, it comes back the
  // ! moment the next submit dirties that field again — a verdict about a value nobody typed.
  it("does not bring the last attempt's verdict back on the next submit", async () => {
    const { open, serverErrors, emitted } = await mountDialog();

    await fillValidCreation();
    await submitAndSettle(emitted);

    serverErrors.value = { email: ['The email has already been taken.'] };
    await waitFor(() =>
      expect(screen.getByText('The email has already been taken.')).toBeTruthy()
    );

    open.value = false;
    await waitFor(() => expect(screen.queryByLabelText('Name')).toBeNull());
    open.value = true;
    await waitFor(() => expect(field('Name')).toBeTruthy());

    await fillValidCreation();
    await submit();
    await settleValidation();

    expect(screen.queryByText('The email has already been taken.')).toBeNull();
  });

  it('asks to close when Cancel is pressed', async () => {
    const { emitted } = await mountDialog();

    await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(emitted.close).toHaveLength(1);
  });
});
