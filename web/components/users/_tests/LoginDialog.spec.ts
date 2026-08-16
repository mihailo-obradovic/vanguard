// @vitest-environment nuxt
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderSuspended } from '@nuxt/test-utils/runtime';
import { screen, fireEvent, cleanup, waitFor } from '@testing-library/vue';
import { flushPromises } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import { defineComponent, nextTick, reactive } from 'vue';

import LoginDialog from '../LoginDialog.vue';

import type { Credentials } from '@/types/auth';

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

const confirmed: Credentials[] = [];
let registerClicks = 0;
let forgotPasswordClicks = 0;

const AnOwnedLoginDialog = defineComponent({
  // ! Only `components/_shared` is auto-imported (`components.dirs`), so this one is registered by hand.
  components: { LoginDialog },
  setup() {
    return {
      owner,
      onConfirm: (form: Credentials) => confirmed.push(form),
      onRegister: () => (registerClicks += 1),
      onForgotPassword: () => (forgotPasswordClicks += 1)
    };
  },
  template: `
    <LoginDialog
      v-model="owner.open"
      :server-errors="owner.serverErrors"
      @confirm="onConfirm"
      @register-click="onRegister"
      @forgot-password-click="onForgotPassword"
    />
  `
});

/** Vuetify needs supplying by hand — `renderSuspended` does not run the Nuxt plugin that installs it. */
function renderOwner() {
  return renderSuspended(AnOwnedLoginDialog, {
    global: { plugins: [createVuetify()] }
  });
}

async function open() {
  owner.open = true;

  await nextTick();
  await waitFor(() => expect(screen.getByLabelText(/^Email$/)).toBeTruthy());
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

describe('LoginDialog', () => {
  beforeEach(() => {
    Object.assign(owner, { open: false, serverErrors: {} });
    confirmed.length = 0;
    registerClicks = 0;
    forgotPasswordClicks = 0;
  });

  afterEach(() => {
    cleanup();
    // ! The dialog teleports to body, outside the container `cleanup` owns.
    document.body.innerHTML = '';
  });

  // ! The prefilled development credentials are deliberate on this template, so the dialog opens
  // ! already valid. Anything asserting "empty on open" here would be asserting the wrong contract.
  it('opens on the development credentials, ready to submit', async () => {
    await renderOwner();
    await open();
    await flushPromises();

    expect(field(/^Email$/).value).toBe('test@example.com');
    expect(field(/^Password$/).value).toBe('gmaz1234');
    expect(confirmButton().disabled).toBe(false);
  });

  it('reports the credentials to its owner', async () => {
    await renderOwner();
    await open();

    await fireEvent.update(field(/^Email$/), 'ana@example.com');
    await fireEvent.update(field(/^Password$/), 'hunter2hunter2');
    await flushPromises();
    await fireEvent.click(confirmButton());

    await waitFor(() => expect(confirmed).toHaveLength(1));
    expect(confirmed[0]).toEqual({
      email: 'ana@example.com',
      password: 'hunter2hunter2'
    });
  });

  // ! An incomplete form is refused by disabling the confirmation rather than by validating on
  // ! submit, so there is nothing to press and no message to read — the button is the whole signal.
  it('refuses an address that is not one', async () => {
    await renderOwner();
    await open();

    await fireEvent.update(field(/^Email$/), 'ana@');
    await flushPromises();

    expect(confirmButton().disabled).toBe(true);
    expect(confirmed).toHaveLength(0);
  });

  // ! The length bound is what tells the shared factory apart from the bare `{ required, email }`
  // ! this dialog used to declare: 255 is the column width, and only the factory carries it.
  it('refuses an address longer than the column allows', async () => {
    await renderOwner();
    await open();

    await fireEvent.update(field(/^Email$/), `${'a'.repeat(246)}@example.com`);
    await flushPromises();

    expect(confirmButton().disabled).toBe(true);
    expect(confirmed).toHaveLength(0);
  });

  it('refuses a login with no password', async () => {
    await renderOwner();
    await open();

    await fireEvent.update(field(/^Password$/), '');
    await flushPromises();

    expect(confirmButton().disabled).toBe(true);
    expect(confirmed).toHaveLength(0);
  });

  // ! The 422 only reaches the field once the submit has marked it dirty — Regle keeps `$errors`
  // ! empty for an untouched field, external errors included. That is why this walks the real
  // ! sequence (submit, server refuses) rather than just setting the prop.
  it('shows the server’s complaint against the field it names', async () => {
    await renderOwner();
    await open();

    await flushPromises();
    await fireEvent.click(confirmButton());
    await failWith({ email: ['These credentials do not match our records.'] });

    expect(
      await screen.findByText('These credentials do not match our records.')
    ).toBeTruthy();
  });

  it('closes on cancel without reporting anything', async () => {
    await renderOwner();
    await open();
    await flushPromises();

    await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(owner.open).toBe(false);
    expect(confirmed).toHaveLength(0);
  });

  it('hands over to the registration dialog', async () => {
    await renderOwner();
    await open();

    await fireEvent.click(screen.getByText(/Register here/));

    expect(registerClicks).toBe(1);
    // * It closes itself before emitting, so the layout only has to open the next one.
    expect(owner.open).toBe(false);
  });

  it('hands over to the reset-request dialog', async () => {
    await renderOwner();
    await open();

    await fireEvent.click(screen.getByText('Forgot your password?'));

    expect(forgotPasswordClicks).toBe(1);
    expect(owner.open).toBe(false);
  });
});
