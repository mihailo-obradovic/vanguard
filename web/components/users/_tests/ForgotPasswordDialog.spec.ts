// @vitest-environment nuxt
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderSuspended } from '@nuxt/test-utils/runtime';
import { screen, fireEvent, cleanup, waitFor } from '@testing-library/vue';
import { flushPromises } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import { defineComponent, nextTick, reactive } from 'vue';

import ForgotPasswordDialog from '../ForgotPasswordDialog.vue';

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

const confirmed: { email: string }[] = [];
let backToLogin = 0;

let setLocale!: (locale: 'en' | 'sr-Latn' | 'sr-Cyrl') => Promise<void>;

const AnOwnedForgotPasswordDialog = defineComponent({
  // ! Only `components/_shared` is auto-imported (`components.dirs`), so this one is registered by hand.
  components: { ForgotPasswordDialog },
  setup() {
    setLocale = useI18n().setLocale;

    return {
      owner,
      onConfirm: (form: { email: string }) => confirmed.push(form),
      onBackToLogin: () => (backToLogin += 1)
    };
  },
  template: `
    <ForgotPasswordDialog
      v-model="owner.open"
      :server-errors="owner.serverErrors"
      @confirm="onConfirm"
      @back-to-login-click="onBackToLogin"
    />
  `
});

/** Vuetify needs supplying by hand — `renderSuspended` does not run the Nuxt plugin that installs it. */
function renderOwner() {
  return renderSuspended(AnOwnedForgotPasswordDialog, {
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

function emailField() {
  return screen.getByLabelText(/^Email$/) as HTMLInputElement;
}

function confirmButton() {
  return screen.getByRole('button', { name: 'Confirm' }) as HTMLButtonElement;
}

describe('ForgotPasswordDialog', () => {
  beforeEach(() => {
    Object.assign(owner, { open: false, serverErrors: {} });
    confirmed.length = 0;
    backToLogin = 0;
  });

  afterEach(async () => {
    cleanup();
    // ! The dialog teleports to body, outside the container `cleanup` owns.
    document.body.innerHTML = '';
    // * renderSuspended shares one i18n instance across renders within the file.
    await setLocale('en');
  });

  it('opens on an empty address, with no way to send it', async () => {
    await renderOwner();
    await open();

    expect(emailField().value).toBe('');
    expect(confirmButton().disabled).toBe(true);
  });

  it('reports the address to its owner', async () => {
    await renderOwner();
    await open();

    await fireEvent.update(emailField(), 'ana@example.com');
    await flushPromises();
    await fireEvent.click(confirmButton());

    await waitFor(() => expect(confirmed).toHaveLength(1));
    expect(confirmed[0]).toEqual({ email: 'ana@example.com' });
  });

  // ! An address the rules refuse is held back by disabling the confirmation rather than by
  // ! validating on submit, so there is nothing to press — the button is the whole signal.
  it('refuses an address that is not one', async () => {
    await renderOwner();
    await open();

    await fireEvent.update(emailField(), 'ana@');
    await flushPromises();

    expect(confirmButton().disabled).toBe(true);
    expect(confirmed).toHaveLength(0);
  });

  // ! The length bound is what tells the shared factory apart from the bare `{ required, email }`
  // ! this dialog used to declare: 255 is the column width, and only the factory carries it.
  it('refuses an address longer than the column allows', async () => {
    await renderOwner();
    await open();

    await fireEvent.update(emailField(), `${'a'.repeat(246)}@example.com`);
    await flushPromises();

    expect(confirmButton().disabled).toBe(true);
    expect(confirmed).toHaveLength(0);
  });

  // ! The 422 only reaches the field once the submit has marked it dirty — Regle keeps `$errors`
  // ! empty for an untouched field, external errors included. That is why this walks the real
  // ! sequence (fill, submit, server refuses) rather than just setting the prop.
  it('shows the server’s complaint against the field it names', async () => {
    await renderOwner();
    await open();

    await fireEvent.update(emailField(), 'nobody@example.com');
    await flushPromises();
    await fireEvent.click(confirmButton());
    await failWith({
      email: ['We cannot find a user with that email address.']
    });

    expect(
      await screen.findByText('We cannot find a user with that email address.')
    ).toBeTruthy();
  });

  it('closes on cancel without reporting anything', async () => {
    await renderOwner();
    await open();

    await fireEvent.update(emailField(), 'ana@example.com');
    await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(owner.open).toBe(false);
    expect(confirmed).toHaveLength(0);
  });

  it('hands the visitor back to the login dialog', async () => {
    await renderOwner();
    await open();

    await fireEvent.click(screen.getByText('Back to login?'));

    expect(backToLogin).toBe(1);
    // * It closes itself before emitting, so the layout only has to open the next one.
    expect(owner.open).toBe(false);
  });

  // ! The hint is the one piece of prose in this dialog. Asserting it in English would pass just as
  // ! well against a hardcoded sentence, so this asserts it in a language only the catalog knows.
  // ! This is the discriminator case exception 2 allows (`catalyst/conventions/testing.md`, What is
  // ! deliberately not tested): the exact string is the only observable separating "localized" from
  // ! "hardcoded", and hardcoded is the defect writing this spec actually found. It is the suite's
  // ! one exact-prose assertion, deliberately — the cost is that rewording the Serbian reddens it.
  it('explains itself in the visitor’s language', async () => {
    await renderOwner();
    await open();

    await setLocale('sr-Latn');
    await flushPromises();

    expect(
      screen.getByText(
        'Unesite svoju e-adresu i poslaćemo vam link za resetovanje lozinke.'
      )
    ).toBeTruthy();
  });
});
