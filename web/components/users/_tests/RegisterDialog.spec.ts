// @vitest-environment nuxt
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderSuspended } from '@nuxt/test-utils/runtime';
import { screen, fireEvent, cleanup, waitFor } from '@testing-library/vue';
import { flushPromises } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import { defineComponent, nextTick, reactive } from 'vue';

import { server } from '@/mocks/server';
import { emailAvailabilityHandler } from '@/mocks/handlers/user';
import { recordRequests } from '@/mocks/requests';

import RegisterDialog from '../RegisterDialog.vue';

import type { RegistrationForm } from '@/types/auth';

// ! happy-dom has no `visualViewport`, and Vuetify's overlay positioning reaches for it as a bare
// ! global — optional chaining does not save an *undeclared* name from a ReferenceError.
vi.stubGlobal('visualViewport', null);

/**
 * The dialog's `serverErrors` change while it is open — a 422 arrives after a submit — and
 * `rerender` does not reach through `renderSuspended`'s wrapper, so an owner holds the props in a
 * reactive object the test drives directly, the way `layouts/Default.vue` does.
 */
const owner = reactive<{
  open: boolean;
  serverErrors: Record<string, string[]>;
}>({ open: false, serverErrors: {} });

const requests = recordRequests();

const confirmed: RegistrationForm[] = [];
let logInClicks = 0;

const AnOwnedRegisterDialog = defineComponent({
  // ! Only `components/_shared` is auto-imported (`components.dirs`), so this one is registered by hand.
  components: { RegisterDialog },
  setup() {
    return {
      owner,
      onConfirm: (form: RegistrationForm) => confirmed.push(form),
      onLogIn: () => (logInClicks += 1)
    };
  },
  template: `
    <RegisterDialog
      v-model="owner.open"
      :server-errors="owner.serverErrors"
      @confirm="onConfirm"
      @log-in-click="onLogIn"
    />
  `
});

/** Vuetify needs supplying by hand — `renderSuspended` does not run the Nuxt plugin that installs it. */
function renderOwner() {
  return renderSuspended(AnOwnedRegisterDialog, {
    global: { plugins: [createVuetify()] }
  });
}

async function open() {
  owner.open = true;

  await nextTick();
  await waitFor(() => expect(screen.getByLabelText(/^Name$/)).toBeTruthy());
}

/**
 * ! The availability check is a debounced network rule, so a filled form is not submittable on the
 * ! next microtask — `flushPromises` cannot settle a 500ms timer. Waiting on the button is waiting
 * ! on the condition the user waits on.
 */
function readyToConfirm() {
  return waitFor(() => expect(confirmButton().disabled).toBe(false), {
    timeout: 3000
  });
}

/**
 * * The mirror of `readyToConfirm`. The debounce sits on the email field as a whole, so even its
 * * synchronous rules report a beat late — the delay a user sees before a typo is called out.
 */
function heldBack() {
  return waitFor(() => expect(confirmButton().disabled).toBe(true), {
    timeout: 3000
  });
}

/** Everything the form needs to pass its own rules, settled and submittable. */
async function fillInAValidRegistration() {
  await fireEvent.update(field(/^Name$/), 'Ana');
  await fireEvent.update(field(/^Email$/), 'ana@example.com');
  await fireEvent.update(field(/^Password$/), 'hunter2hunter2');
  await fireEvent.update(field(/^Password Confirmation$/), 'hunter2hunter2');
  await flushPromises();
  await readyToConfirm();
}

/** A 422 comes back after a submit, so the errors arrive while the dialog is already open. */
async function failWith(serverErrors: Record<string, string[]>) {
  owner.serverErrors = serverErrors;

  await nextTick();
}

function field(label: RegExp) {
  return screen.getByLabelText(label) as HTMLInputElement;
}

function confirmButton() {
  return screen.getByRole('button', { name: 'Confirm' }) as HTMLButtonElement;
}

describe('RegisterDialog', () => {
  beforeEach(() => {
    Object.assign(owner, { open: false, serverErrors: {} });
    confirmed.length = 0;
    logInClicks = 0;
    requests.reset();
    // * The email rules ask whether the address is free the moment one is typed.
    server.use(emailAvailabilityHandler());
  });

  afterEach(() => {
    cleanup();
    // ! The dialog teleports to body, outside the container `cleanup` owns.
    document.body.innerHTML = '';
  });

  it('opens blank, with no way to confirm', async () => {
    await renderOwner();
    await open();
    await flushPromises();

    expect(field(/^Name$/).value).toBe('');
    expect(field(/^Email$/).value).toBe('');
    // * The password pair too — a registration form that opened prefilled would be a real defect.
    expect(field(/^Password$/).value).toBe('');
    expect(field(/^Password Confirmation$/).value).toBe('');
    expect(confirmButton().disabled).toBe(true);
  });

  it('closes on cancel without reporting anything', async () => {
    await renderOwner();
    await open();

    await fillInAValidRegistration();
    await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(owner.open).toBe(false);
    expect(confirmed).toHaveLength(0);
  });

  it('reports the completed registration to its owner', async () => {
    await renderOwner();
    await open();

    await fillInAValidRegistration();
    await fireEvent.click(confirmButton());

    await waitFor(() => expect(confirmed).toHaveLength(1));
    expect(confirmed[0]).toEqual({
      name: 'Ana',
      email: 'ana@example.com',
      password: 'hunter2hunter2',
      password_confirmation: 'hunter2hunter2'
    });
  });

  // ! An incomplete or inconsistent form is refused by disabling the confirmation rather than by
  // ! validating on submit, so there is nothing to press — the button is the whole signal.
  it('holds back a registration whose confirmation does not match', async () => {
    await renderOwner();
    await open();

    await fillInAValidRegistration();
    expect(confirmButton().disabled).toBe(false);

    await fireEvent.update(field(/^Password Confirmation$/), 'hunter3hunter3');
    await flushPromises();

    expect(confirmButton().disabled).toBe(true);
    expect(confirmed).toHaveLength(0);
  });

  it('holds back a password shorter than the backend accepts', async () => {
    await renderOwner();
    await open();

    await fireEvent.update(field(/^Name$/), 'Ana');
    await fireEvent.update(field(/^Email$/), 'ana@example.com');
    await fireEvent.update(field(/^Password$/), 'hunter2');
    await fireEvent.update(field(/^Password Confirmation$/), 'hunter2');
    await flushPromises();

    expect(confirmButton().disabled).toBe(true);
  });

  // ! 255 is the column width the backend enforces; the client mirrors it so the user is not told
  // ! about it only after a round-trip.
  it('holds back a name longer than the column allows', async () => {
    await renderOwner();
    await open();

    await fillInAValidRegistration();
    expect(confirmButton().disabled).toBe(false);

    await fireEvent.update(field(/^Name$/), 'a'.repeat(256));
    await flushPromises();

    expect(confirmButton().disabled).toBe(true);
  });

  it('refuses an address that is not one', async () => {
    await renderOwner();
    await open();

    await fillInAValidRegistration();
    await fireEvent.update(field(/^Email$/), 'ana@');
    await heldBack();

    expect(confirmed).toHaveLength(0);
  });

  // ! The address a visitor claims goes past the server before they submit, so "already taken"
  // ! arrives as they type rather than as a 422 afterwards. This is what tells the shared account
  // ! rules apart from the plain ones — no other rule on this form leaves the app.
  it('asks the server whether the address is free', async () => {
    await renderOwner();
    await open();

    await fireEvent.update(field(/^Email$/), 'ana@example.com');

    await waitFor(() =>
      expect(requests.trace()).toContain('GET /api/email-availability')
    );

    // ! Let the check finish before the test ends — a validation resolving after teardown writes
    // ! into a disposed Regle scope and surfaces as an unhandled rejection.
    await requests.settle();
    await flushPromises();
  });

  // ! Both password fields share one `visible` model, so revealing either reveals the pair. An
  // ! assertion on a single field would pass just as well against two independent toggles.
  it('reveals the password and its confirmation together', async () => {
    await renderOwner();
    await open();

    expect(field(/^Password$/).type).toBe('password');
    expect(field(/^Password Confirmation$/).type).toBe('password');

    await fireEvent.click(
      screen.getAllByRole('button', { name: 'Show password' })[0]!
    );

    expect(field(/^Password$/).type).toBe('text');
    expect(field(/^Password Confirmation$/).type).toBe('text');
  });

  // ! The 422 only reaches the field once the submit has marked it dirty — Regle keeps `$errors`
  // ! empty for an untouched field, external errors included. That is why this walks the real
  // ! sequence (fill, submit, server refuses) rather than just setting the prop.
  it('shows the server’s complaint against the field it names', async () => {
    await renderOwner();
    await open();

    await fillInAValidRegistration();
    await fireEvent.click(confirmButton());
    await failWith({ email: ['That email is already taken.'] });

    expect(
      await screen.findByText('That email is already taken.')
    ).toBeTruthy();
  });

  it('hands over to the login dialog', async () => {
    await renderOwner();
    await open();

    await fireEvent.click(screen.getByText(/Login here/));

    expect(logInClicks).toBe(1);
    // * It closes itself before emitting, so the layout only has to open the next one.
    expect(owner.open).toBe(false);
  });
});
