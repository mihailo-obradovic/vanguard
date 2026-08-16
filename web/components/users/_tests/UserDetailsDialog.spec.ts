// @vitest-environment nuxt
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderSuspended } from '@nuxt/test-utils/runtime';
import { screen, fireEvent, cleanup, waitFor } from '@testing-library/vue';
import { createVuetify } from 'vuetify';
import { defineComponent, nextTick, reactive } from 'vue';

import { buildUser } from '@/mocks/fixtures';
import { http, HttpResponse } from 'msw';

import { server } from '@/mocks/server';
import { apiUrl } from '@/mocks/api';
import { emailAvailabilityHandler } from '@/mocks/handlers/user';

import UserDetailsDialog from '../UserDetailsDialog.vue';

import type { UserDetailsForm } from '../UserDetailsDialog.vue';
import type { User } from '@/types/auth';

// ! happy-dom has no `visualViewport`, and Vuetify's overlay positioning reaches for it as a bare
// ! global — optional chaining does not save an *undeclared* name from a ReferenceError.
vi.stubGlobal('visualViewport', null);

const ANA = buildUser({
  id: 1,
  name: 'Ana',
  email: 'ana@example.com',
  role: 'admin'
});

const BOB = buildUser({
  id: 2,
  name: 'Bob',
  email: 'bob@example.com',
  role: 'user'
});

/**
 * The subject changes between one opening and the next — that is what the reset-on-open watcher
 * is for — and `rerender` does not reach through `renderSuspended`'s wrapper, so an owner holds
 * the props in a reactive object the test drives directly.
 */
const owner = reactive<{
  open: boolean;
  user: User | null;
  serverErrors: Record<string, string[]>;
}>({ open: false, user: null, serverErrors: {} });

const confirmed: UserDetailsForm[] = [];

const AnOwnedDetailsDialog = defineComponent({
  // ! Only `components/_shared` is auto-imported (`components.dirs`), so this one is registered by hand.
  components: { UserDetailsDialog },
  setup() {
    return {
      owner,
      onConfirm: (form: UserDetailsForm) => confirmed.push(form)
    };
  },
  template: `
    <UserDetailsDialog
      v-model="owner.open"
      :user="owner.user"
      :server-errors="owner.serverErrors"
      @confirm="onConfirm"
    />
  `
});

/** Vuetify needs supplying by hand — `renderSuspended` does not run the Nuxt plugin that installs it. */
function renderOwner() {
  return renderSuspended(AnOwnedDetailsDialog, {
    global: { plugins: [createVuetify()] }
  });
}

/** Open the dialog the way its owner does: set the subject, then the flag. */
async function open(user: User | null) {
  Object.assign(owner, { user, open: true });

  await nextTick();
  await waitFor(() => expect(screen.getByLabelText(/^Name$/)).toBeTruthy());
}

async function close() {
  owner.open = false;

  await nextTick();
}

function field(label: RegExp) {
  return screen.getByLabelText(label) as HTMLInputElement;
}

function confirmButton() {
  return screen.getByRole('button', { name: 'Confirm' }) as HTMLButtonElement;
}

/**
 * ! The availability check is a debounced network rule and the confirmation is bound to
 * ! `r$.$invalid`, so the button is disabled while the check is in flight — a click landing then
 * ! does nothing at all. `flushPromises` cannot settle a 500ms timer; this waits on the button.
 */
function readyToConfirm() {
  return waitFor(() => expect(confirmButton().disabled).toBe(false), {
    timeout: 3000
  });
}

/** The role dropdown opens on ArrowDown — a click on the field does not reach it in happy-dom. */
async function chooseRole(name: string) {
  await fireEvent.keyDown(field(/^Role$/), { key: 'ArrowDown' });
  await fireEvent.click(await screen.findByRole('option', { name }));
}

describe('UserDetailsDialog', () => {
  beforeEach(() => {
    Object.assign(owner, { open: false, user: null, serverErrors: {} });
    confirmed.length = 0;
    // * The email rules ask whether the address is free the moment one is typed.
    server.use(emailAvailabilityHandler());
  });

  afterEach(() => {
    cleanup();
    // ! The dialog teleports to body, outside the container `cleanup` owns.
    document.body.innerHTML = '';
  });

  it('opens on the user being edited, named in its title', async () => {
    await renderOwner();
    await open(ANA);

    expect(screen.getByText('Edit Ana')).toBeTruthy();
    expect(field(/^Name$/).value).toBe('Ana');
    expect(field(/^Email$/).value).toBe('ana@example.com');
  });

  // ! The reset runs on open, not after the close transition: at close time the `user` prop still
  // ! describes the session just finished, so the next opening would show the previous user.
  it('opens on the next user, not the last one', async () => {
    await renderOwner();

    await open(ANA);
    await close();
    await open(BOB);

    expect(field(/^Name$/).value).toBe('Bob');
    expect(field(/^Email$/).value).toBe('bob@example.com');
  });

  it('forgets an abandoned edit', async () => {
    await renderOwner();

    await open(ANA);
    await fireEvent.update(field(/^Name$/), 'Half-finished');
    await close();
    await open(ANA);

    expect(field(/^Name$/).value).toBe('Ana');
  });

  it('reports the edited details to its owner', async () => {
    await renderOwner();
    await open(ANA);

    await fireEvent.update(field(/^Name$/), 'Ana Marić');
    await readyToConfirm();
    await fireEvent.click(confirmButton());

    await waitFor(() => expect(confirmed).toHaveLength(1));
    expect(confirmed[0]).toEqual({
      name: 'Ana Marić',
      email: 'ana@example.com',
      role: 'admin'
    });
  });

  it('keeps an invalid form to itself', async () => {
    await renderOwner();
    await open(ANA);

    await fireEvent.update(field(/^Email$/), 'not-an-email');
    await fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(
      await screen.findByText('The Email field must be a valid email address.')
    ).toBeTruthy();
    expect(confirmed).toHaveLength(0);
  });

  // ! The 422 only reaches the field once the submit has marked it dirty — Regle keeps `$errors`
  // ! empty for an untouched field, external errors included.
  it('shows the server’s complaint against the field it names', async () => {
    await renderOwner();
    await open(ANA);

    await readyToConfirm();
    await fireEvent.click(confirmButton());
    owner.serverErrors = { email: ['That email is already taken.'] };
    await nextTick();

    expect(
      await screen.findByText('That email is already taken.')
    ).toBeTruthy();
  });

  // ! The user being edited owns the address already, so the check has to exclude them, or an edit
  // ! that only changes the role would be refused by the form itself.
  it('asks the server whether the address is free, ignoring the user being edited', async () => {
    const asked: URL[] = [];

    server.use(
      http.get(apiUrl('/api/email-availability'), ({ request }) => {
        asked.push(new URL(request.url));

        return HttpResponse.json({ available: true });
      })
    );

    await renderOwner();
    await open(ANA);

    await fireEvent.update(field(/^Email$/), 'ana.maric@example.com');

    // * Opening already checks the address the dialog was filled with, so the typed one is later.
    await waitFor(() =>
      expect(asked.at(-1)?.searchParams.get('email')).toBe(
        'ana.maric@example.com'
      )
    );
    expect(asked.at(-1)!.searchParams.get('ignore_id')).toBe(String(ANA.id));
  });

  it('offers both roles, and reports the one chosen', async () => {
    await renderOwner();
    await open(ANA);

    await chooseRole('User');
    await readyToConfirm();
    await fireEvent.click(confirmButton());

    await waitFor(() => expect(confirmed).toHaveLength(1));
    expect(confirmed[0]).toMatchObject({ role: 'user' });
  });

  // ! The owner sets `user` and the open flag separately, so a dialog opened before its subject
  // ! arrives must fall back to a blank form rather than render `undefined` into the fields.
  it('opens blank when there is no user to edit', async () => {
    await renderOwner();
    await open(null);

    expect(field(/^Name$/).value).toBe('');
    expect(field(/^Email$/).value).toBe('');
  });

  it('refuses a user with no name', async () => {
    await renderOwner();
    await open(ANA);

    await fireEvent.update(field(/^Name$/), '');
    await fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(await screen.findByText('This field is required.')).toBeTruthy();
    expect(confirmed).toHaveLength(0);
  });
});

// ! The `after-leave` re-emit — the reason this dialog can hold its subject's name in the title
// ! without it blanking mid-fade — has no case here and cannot have one: `v-dialog` fades through
// ! VDialogTransition, which needs the Web Animations API and real layout, and happy-dom has
// ! neither, so the event never fires. Live browser walk (`catalyst/operations.md`).
