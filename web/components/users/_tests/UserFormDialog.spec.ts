// @vitest-environment nuxt
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { http, HttpResponse } from 'msw';
import { screen, fireEvent, cleanup, waitFor } from '@testing-library/vue';

import { server } from '@/mocks/server';
import { apiUrl } from '@/mocks/api';
import { buildUser } from '@/mocks/fixtures';

import FormDialog from '@/components/_shared/FormDialog.vue';
import { Select } from '@/components/ui/select';

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

  // * `mountSuspended` rather than `renderSuspended` so the specs can reach the two controls that
  // * are no longer plain DOM — see `submit` and `pickRole`. Testing Library's `screen` queries the
  // * document either way, so every other query is unaffected.
  const wrapper = await mountSuspended(page);

  wrappers.push(wrapper);

  return { open, subject, serverErrors, emitted, wrapper };
}

// ! Derived from `mountSuspended`, not from `mountDialog`: that function pushes into `wrappers`
// ! below, so taking the type from it is circular and silently resolves to `any`.
type Wrapper = Awaited<ReturnType<typeof mountSuspended>>;

const wrappers: Wrapper[] = [];

function field(label: string) {
  return screen.getByLabelText(label) as HTMLInputElement;
}

/**
 * Ask the dialog to confirm, rather than clicking the button.
 *
 * ! The submit button is disabled while `r$.$invalid`, and the debounced availability rule keeps a
 * ! freshly filled form invalid for 500ms — clicking would silently do nothing and the assertion
 * ! would read as a missing emit. Confirming exercises the handler's own guard, which awaits the
 * ! async rules; the disabled button gets its own case.
 *
 * ! This used to fire `submit` on the `<form>`. `FormDialog` has no form element — its actions sit
 * ! in the dialog footer, outside any — so the equivalent seam is the confirm the dialog emits,
 * ! which is what Enter and the footer button both reach `handleSubmit` through.
 */
function submit(wrapper: Wrapper) {
  wrapper.findComponent(FormDialog).vm.$emit('confirm');

  return wrapper.vm.$nextTick();
}

/**
 * Pick a role the way a user does — at the component seam.
 *
 * ! Reka UI's listbox cannot be opened in this environment: clicking the trigger renders no
 * ! options at all, so a click-driven test would assert against an empty list and pass for the
 * ! wrong reason. The rendered listbox is a live browser check (`catalyst/operations.md`).
 */
function pickRole(wrapper: Wrapper, role: 'user' | 'admin') {
  wrapper.findComponent(Select).vm.$emit('update:modelValue', role);

  return wrapper.vm.$nextTick();
}

/** What the role control shows — the trigger's label, not a native select's value. */
function shownRole() {
  return screen.getByLabelText('Role').textContent?.trim();
}

/**
 * Submit and wait for the emit that follows validation.
 *
 * ! Leaving `$validate()` pending across the end of a test unmounts the form under it, and Regle
 * ! rejects into an unhandled rejection that fails the whole run without failing a test (tracker
 * ! item: "Regle $validate rejects after unmount"). A spec that submits must wait for the outcome.
 */
async function submitAndSettle(wrapper: Wrapper, emitted: Emitted) {
  await submit(wrapper);

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

/** The message a control is described by — what a screen reader announces with it. */
function describedBy(control: HTMLElement) {
  const id = control.getAttribute('aria-describedby');

  return id ? document.getElementById(id)?.textContent?.trim() : undefined;
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
    wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
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
    expect(shownRole()).toBe('Admin');
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
    const { emitted, wrapper } = await mountDialog();

    await fillValidCreation();

    await submit(wrapper);

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
    const { emitted, wrapper } = await mountDialog(
      buildUser({ id: 7, name: 'Ada', email: 'ada@example.com' })
    );

    await fireEvent.update(field('Name'), 'Ada Lovelace');

    await submit(wrapper);

    await waitFor(() => expect(emitted.update).toHaveLength(1));
    expect(emitted.update[0]).toEqual([
      7,
      { name: 'Ada Lovelace', email: 'ada@example.com', role: 'user' }
    ]);
  });

  it('sends the password pair on an update that set one', async () => {
    const { emitted, wrapper } = await mountDialog(
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

    await submit(wrapper);

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
    const { emitted, wrapper } = await mountDialog();

    await fillValidCreation();
    await pickRole(wrapper, 'admin');

    await submitAndSettle(wrapper, emitted);

    expect(emitted.create[0]?.role).toBe('admin');
  });

  it('carries a changed role on an update', async () => {
    const { emitted, wrapper } = await mountDialog(
      buildUser({ id: 7, name: 'Ada', email: 'ada@example.com', role: 'user' })
    );

    await pickRole(wrapper, 'admin');

    await submitAndSettle(wrapper, emitted);

    expect(emitted.update[0]?.[1].role).toBe('admin');
  });

  it('does not emit anything for a form the rules reject', async () => {
    const { emitted, wrapper } = await mountDialog();

    await fireEvent.update(field('Name'), 'Ada');
    await fireEvent.update(field('Email'), 'not-an-email');

    await submit(wrapper);

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
    const { emitted, wrapper } = await mountDialog();

    await fireEvent.update(field('Email'), 'ada@example.com');

    await submit(wrapper);

    await waitFor(() =>
      expect(screen.getByText('The name field is required.')).toBeTruthy()
    );

    await settleValidation();

    expect(emitted.create).toHaveLength(0);
  });

  it('describes a missing password pair by its messages', async () => {
    const { emitted, wrapper } = await mountDialog();

    await fireEvent.update(field('Name'), 'Ada');
    await fireEvent.update(field('Email'), 'ada@example.com');

    await submit(wrapper);

    await waitFor(() =>
      expect(describedBy(field('Password'))).toBe(
        'The password field is required.'
      )
    );
    expect(describedBy(field('Password confirmation'))).toBe(
      'The password confirmation field is required.'
    );

    await settleValidation();

    expect(emitted.create).toHaveLength(0);
  });

  it('shows an ordinary user’s role on the picker', async () => {
    await mountDialog(buildUser({ id: 7, role: 'user' }));

    expect(shownRole()).toBe('User');
  });

  // * Escape is the dialog primitive's, but the page only hears about it because this dialog forwards it.
  it("forwards the dialog's own close request", async () => {
    const { emitted } = await mountDialog();

    await fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(emitted.close).toHaveLength(1);
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
    const { serverErrors, emitted, wrapper } = await mountDialog();

    await fillValidCreation();
    await submitAndSettle(wrapper, emitted);

    serverErrors.value = { email: ['The email has already been taken.'] };

    await waitFor(() =>
      expect(screen.getByText('The email has already been taken.')).toBeTruthy()
    );
  });

  // ! Reopening has to clear the last attempt's server errors too, or a fresh form opens already
  // ! carrying a verdict about a value that is no longer in it.
  it('clears a server error when it is reopened', async () => {
    const { open, serverErrors, emitted, wrapper } = await mountDialog();

    await fillValidCreation();
    await submitAndSettle(wrapper, emitted);

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
    const { open, serverErrors, emitted, wrapper } = await mountDialog();

    await fillValidCreation();
    await submitAndSettle(wrapper, emitted);

    serverErrors.value = { email: ['The email has already been taken.'] };
    await waitFor(() =>
      expect(screen.getByText('The email has already been taken.')).toBeTruthy()
    );

    open.value = false;
    await waitFor(() => expect(screen.queryByLabelText('Name')).toBeNull());
    open.value = true;
    await waitFor(() => expect(field('Name')).toBeTruthy());

    await fillValidCreation();
    await submit(wrapper);
    await settleValidation();

    expect(screen.queryByText('The email has already been taken.')).toBeNull();
  });

  it('asks to close when Cancel is pressed', async () => {
    const { emitted } = await mountDialog();

    await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(emitted.close).toHaveLength(1);
  });
});
