// @vitest-environment nuxt
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { h, nextTick } from 'vue';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { http, HttpResponse } from 'msw';
import { screen, fireEvent, cleanup, waitFor } from '@testing-library/vue';
import { flushPromises } from '@vue/test-utils';

import { UApp, USelect } from '#components';

import { server } from '@/mocks/server';
import { apiUrl } from '@/mocks/api';
import { userHandlers } from '@/mocks/handlers/user';
import { recordRequests } from '@/mocks/requests';
import { buildUser } from '@/mocks/fixtures';

import UserFormDialog from '../UserFormDialog.vue';

import type { User } from '@/types/auth';

const requests = recordRequests();

let wrapper: Awaited<ReturnType<typeof mountSuspended>> | null = null;

const CREATE = 'POST /api/users';
const UPDATE_7 = 'PUT /api/users/7';

/**
 * Mount the dialog the way `useOverlay` does — already open, with its subject as a prop.
 *
 * * `<u-modal>` needs `<UApp>` above it for its overlay provider, so the harness supplies one.
 * * The dialog owns its own mutations now, so what it decided to save is only observable on the
 * * wire — which is also the contract `UserRequest` reads.
 */
async function mountDialog(user: User | null = null) {
  const closed: (User | undefined)[] = [];

  wrapper = await mountSuspended({
    setup: () => () =>
      h(UApp, null, {
        default: () =>
          h(UserFormDialog, {
            open: true,
            user,
            onClose: (result?: User) => closed.push(result)
          })
      })
  });

  return { closed };
}

async function sent(trace: string) {
  await requests.settle();

  const index = requests.trace().indexOf(trace);

  expect(index).toBeGreaterThan(-1);

  return (await requests.at(index)).body as Record<string, unknown>;
}

async function settledTrace() {
  await requests.settle();

  return requests.trace();
}

function field(label: string | RegExp) {
  return screen.getByLabelText(label) as HTMLInputElement;
}

function submit() {
  return fireEvent.submit(document.querySelector('form') as HTMLFormElement);
}

/** Past the email field's 500ms debounce, so a pending `$validate()` has resolved. */
function settleValidation() {
  return new Promise((resolve) => setTimeout(resolve, 700));
}

async function fillValidCreation() {
  await fireEvent.update(field('Name'), 'Ada');
  await fireEvent.update(field('Email'), 'ada@example.com');
  await fireEvent.update(field(/^Password$/), 'gmaz1234');
  await fireEvent.update(field(/^Password confirmation$/), 'gmaz1234');
  await settleValidation();
}

/**
 * Pick a role the way the control reports one.
 *
 * ! Driven through the select's own `update:modelValue` rather than by clicking an option: Nuxt UI's
 * ! select is a Reka listbox that commits through pointer-capture APIs jsdom does not implement, so
 * ! no click, pointer sequence or keypress moves it — verified, including with the usual
 * ! `hasPointerCapture`/`scrollIntoView` stubs. The listbox committing on a click is the library's
 * ! own contract; what belongs here is that the picked role reaches the wire, which is the field
 * ! with privilege attached.
 */
function pickRole(value: string) {
  const select = wrapper!.findComponent(USelect);

  select.vm.$emit('update:modelValue', value);

  return nextTick();
}

describe('UserFormDialog', () => {
  beforeEach(() => {
    requests.reset();
    server.use(
      ...userHandlers(),
      http.get(apiUrl('/api/email-availability'), () =>
        HttpResponse.json({ available: true })
      )
    );
  });

  afterEach(async () => {
    await flushPromises();
    // * `mountSuspended` is not one of testing-library's renders, so `cleanup()` never sees it — an unmounted wrapper here is what keeps the next test from finding two of every field.
    wrapper?.unmount();
    wrapper = null;
    cleanup();
  });

  it('opens blank when there is no user to edit', async () => {
    await mountDialog();

    expect(field('Name').value).toBe('');
    expect(screen.getByRole('button', { name: 'Create User' })).toBeTruthy();
  });

  it('seeds itself from the user it was opened on', async () => {
    await mountDialog(
      buildUser({ id: 7, name: 'Ada', email: 'ada@example.com', role: 'admin' })
    );

    expect(field('Name').value).toBe('Ada');
    expect(field('Email').value).toBe('ada@example.com');
    expect(screen.getByRole('button', { name: 'Update User' })).toBeTruthy();
  });

  // ! The subject is read once, at construction. That is safe only because the page opens the
  // ! dialog through `useOverlay` with `destroyOnClose`, so every open is a fresh instance — there
  // ! is no second subject for one instance to re-seed from, which is what the watcher used to do.
  it('creates the user it was filled with', async () => {
    await mountDialog();

    await fillValidCreation();
    await submit();

    expect(await sent(CREATE)).toMatchObject({
      name: 'Ada',
      email: 'ada@example.com',
      role: 'user'
    });
  });

  // ! The backend reads a present password as a change request and rejects a present-but-empty
  // ! `current_password`, so an untouched pair must not travel at all.
  it('leaves the password pair out of an update that did not set one', async () => {
    await mountDialog(
      buildUser({ id: 7, name: 'Ada', email: 'ada@example.com' })
    );

    await fireEvent.update(field('Name'), 'Ada Lovelace');
    await settleValidation();
    await submit();

    expect(await sent(UPDATE_7)).toEqual({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      role: 'user'
    });
  });

  it('sends the password pair on an update that set one', async () => {
    await mountDialog(
      buildUser({ id: 7, name: 'Ada', email: 'ada@example.com' })
    );

    await fireEvent.update(field(/^Password \(/), 'gmaz1234');
    await fireEvent.update(field(/^Password confirmation \(/), 'gmaz1234');
    await settleValidation();
    await submit();

    expect(await sent(UPDATE_7)).toMatchObject({
      password: 'gmaz1234',
      password_confirmation: 'gmaz1234'
    });
  });

  // ! The role is the one field with privilege attached: an admin created as a user, or the other
  // ! way round, is a security bug rather than a cosmetic one.
  it('creates the role that was picked', async () => {
    await mountDialog();

    await pickRole('admin');

    await fillValidCreation();
    await submit();

    expect((await sent(CREATE)).role).toBe('admin');
  });

  it('carries a changed role on an update', async () => {
    await mountDialog(
      buildUser({ id: 7, name: 'Ada', email: 'ada@example.com', role: 'user' })
    );

    await pickRole('admin');
    await settleValidation();
    await submit();

    expect((await sent(UPDATE_7)).role).toBe('admin');
  });

  it('sends nothing for a form the rules reject', async () => {
    await mountDialog();

    await fireEvent.update(field('Email'), 'not-an-email');
    await submit();

    expect(await settledTrace()).not.toContain(CREATE);
  });

  it('names the field when the name is left empty', async () => {
    await mountDialog();

    await fireEvent.update(field('Name'), '');
    await submit();

    expect(await screen.findByText('The name field is required.')).toBeTruthy();
    expect(await settledTrace()).not.toContain(CREATE);
  });

  it('titles itself for the mode it is in', async () => {
    await mountDialog();

    expect(
      screen.getByRole('dialog', { name: 'Create New User' })
    ).toBeTruthy();
  });

  it('titles itself for an edit', async () => {
    await mountDialog(buildUser({ id: 7 }));

    expect(screen.getByRole('dialog', { name: 'Edit User' })).toBeTruthy();
  });

  // ! The errors have to arrive *after* the first render: `useExternalErrors` deliberately omits
  // ! `immediate`, so a value already present when the watcher is created never reaches Regle.
  it('renders the server verdict on the field it names', async () => {
    server.use(
      http.post(apiUrl('/api/users'), () =>
        HttpResponse.json(
          {
            message: 'The given data was invalid.',
            errors: { email: ['That email is already taken.'] }
          },
          { status: 422 }
        )
      )
    );

    await mountDialog();

    await fillValidCreation();
    await submit();

    expect(
      await screen.findByText('That email is already taken.')
    ).toBeTruthy();
  });

  it('resolves with the created user so the opener can react', async () => {
    const { closed } = await mountDialog();

    await fillValidCreation();
    await submit();

    await waitFor(() => expect(closed.length).toBe(1));
    expect(closed[0]?.name).toBe('Ada');
  });

  it('asks to close when Cancel is pressed', async () => {
    const { closed } = await mountDialog();

    await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(closed.length).toBe(1);
    expect(closed[0]).toBeUndefined();
  });
});
