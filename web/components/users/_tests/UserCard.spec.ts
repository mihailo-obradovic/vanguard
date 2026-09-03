// @vitest-environment nuxt
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderSuspended } from '@nuxt/test-utils/runtime';
import { screen, fireEvent, cleanup, waitFor } from '@testing-library/vue';
import { flushPromises } from '@vue/test-utils';
import { createVuetify } from 'vuetify';

import { http, HttpResponse } from 'msw';

import { server } from '@/mocks/server';
import { apiUrl } from '@/mocks/api';
import { authHandlers } from '@/mocks/handlers/auth';
import { emailAvailabilityHandler } from '@/mocks/handlers/user';
import { recordRequests } from '@/mocks/requests';
import { buildUser } from '@/mocks/fixtures';
import { useAuthStore } from '@/stores/useAuthStore';

import UserCard from '../UserCard.vue';

// ! See CookieConsentBanner.spec.ts — Vuetify's overlays reach for this bare global.
vi.stubGlobal('visualViewport', null);

const requests = recordRequests();

const PROFILE_UPDATE = 'PUT /api/profile';

/** Vuetify needs supplying by hand — `renderSuspended` does not run the Nuxt plugin that installs it. */
function renderCard() {
  return renderSuspended(UserCard, {
    global: { plugins: [createVuetify()] }
  });
}

/**
 * The body of the profile update the card sent. The card owns its own mutation, so what it
 * decided to save is only observable on the wire — which is also the contract
 * `ProfileUpdateRequest` reads.
 */
async function profileUpdate() {
  await requests.settle();

  const index = requests.trace().indexOf(PROFILE_UPDATE);

  expect(index).toBeGreaterThan(-1);

  return (await requests.at(index)).body as Record<string, unknown>;
}

/** Everything the card sent, once the wire has gone quiet — so a test can show what is absent from it. */
async function settledTrace() {
  await requests.settle();

  return requests.trace();
}

/** Make the next save come back 422 against a field the card renders. */
function serverRejects(errors: Record<string, string[]>) {
  server.use(
    http.put(apiUrl('/api/profile'), () =>
      HttpResponse.json(
        { message: 'The given data was invalid.', errors },
        { status: 422 }
      )
    )
  );
}

function field(label: RegExp) {
  return screen.getByLabelText(label) as HTMLInputElement;
}

function button(name: string) {
  return screen.getByRole('button', { name });
}

/** The card opens read-only; editing starts from the pencil. */
async function startEditing() {
  await fireEvent.click(button('Edit'));

  await waitFor(() => expect(button('Save')).toBeTruthy());
}

async function fillInANewPassword() {
  await fireEvent.update(field(/^Current password$/), 'oldpassword');
  await fireEvent.update(field(/^New password/), 'hunter2hunter2');
  await fireEvent.update(field(/^Confirm new password$/), 'hunter2hunter2');
}

/** Ignore the reserved-label ghosts: they are a measuring device, not text a user is offered. */
const SHOWN = { ignore: '[aria-hidden="true"]' };

describe('UserCard', () => {
  beforeEach(() => {
    requests.reset();
    // * The email rules ask whether the address is free the moment one is typed.
    server.use(...authHandlers(), emailAvailabilityHandler());
    useAuthStore().resetUser();
    useAuthStore().setUser(
      buildUser({ name: 'Ana', email: 'ana@example.com' })
    );
  });

  afterEach(async () => {
    await flushPromises();
    cleanup();
    document.body.innerHTML = '';
  });

  it('shows the signed-in user, with nothing to change yet', async () => {
    await renderCard();

    expect(field(/^Name$/).value).toBe('Ana');
    expect(field(/^Name$/).readOnly).toBe(true);
    expect(button('Edit')).toBeTruthy();
    expect(screen.queryByLabelText(/^Current password$/)).toBeNull();
  });

  it('offers the password fields once editing starts', async () => {
    await renderCard();
    await startEditing();

    expect(field(/^Name$/).readOnly).toBe(false);
    expect(field(/^Current password$/)).toBeTruthy();
    expect(field(/^New password/)).toBeTruthy();
  });

  it('puts back what the user abandoned', async () => {
    await renderCard();
    await startEditing();

    await fireEvent.update(field(/^Name$/), 'Someone else');
    await fireEvent.click(button('Cancel'));

    await waitFor(() => expect(button('Edit')).toBeTruthy());
    expect(field(/^Name$/).value).toBe('Ana');
  });

  // ! The Escape listener is on the window rather than the card, so it still cancels once focus
  // ! has moved off — a user who tabbed away and changed their mind should not be stuck in an
  // ! edit they cannot leave without the mouse.
  it('cancels the edit on Escape, wherever the focus is', async () => {
    await renderCard();
    await startEditing();

    await fireEvent.update(field(/^Name$/), 'Someone else');
    await fireEvent.keyDown(document.body, { key: 'Escape' });

    await waitFor(() => expect(button('Edit')).toBeTruthy());
    expect(field(/^Name$/).value).toBe('Ana');
  });

  it('does nothing on Escape while it is only being read', async () => {
    await renderCard();

    await fireEvent.keyDown(document.body, { key: 'Escape' });

    expect(button('Edit')).toBeTruthy();
  });

  it('submits the changes when Enter is pressed in a field', async () => {
    await renderCard();
    await startEditing();

    await fireEvent.update(field(/^Name$/), 'Ana Marić');
    await fireEvent.keyDown(field(/^Name$/), { key: 'Enter' });

    expect(await profileUpdate()).toMatchObject({ name: 'Ana Marić' });
  });

  // ! Buttons act on Enter themselves; submitting here as well would fire twice on one keypress.
  // ! This pins the outcome, not the mechanism: the source guards on `closest('button, a')`, but
  // ! removing that guard alone changes nothing here, so the button is already swallowing the key.
  // ! Recorded as an accepted survivor rather than asserted through the DOM structure.
  it('leaves Enter to a button that handles it itself', async () => {
    await renderCard();
    await startEditing();

    await fireEvent.keyDown(button('Save'), { key: 'Enter' });

    expect(await settledTrace()).not.toContain(PROFILE_UPDATE);
  });

  // ! `ProfileUpdateRequest` rejects a password change with no current password, so the form asks
  // ! for it the moment a new one is typed and not before.
  it('asks for the current password only once a new one is typed', async () => {
    await renderCard();
    await startEditing();

    await fireEvent.update(field(/^New password/), 'hunter2hunter2');
    await fireEvent.update(field(/^Confirm new password$/), 'hunter2hunter2');
    await fireEvent.click(button('Save'));

    expect(
      await screen.findByText('The current password field is required.')
    ).toBeTruthy();
    expect(await settledTrace()).not.toContain(PROFILE_UPDATE);
  });

  // ! The backend treats a present `password` as a change request and validates a present-but-empty `current_password` against the stored hash, so a rename must omit all three password keys entirely.
  it('leaves the password fields out of a rename', async () => {
    await renderCard();
    await startEditing();

    await fireEvent.update(field(/^Name$/), 'Ana Marić');
    await fireEvent.click(button('Save'));

    expect(await profileUpdate()).toEqual({
      name: 'Ana Marić',
      email: 'ana@example.com'
    });
  });

  it('sends both password fields when one is being set', async () => {
    await renderCard();
    await startEditing();

    await fillInANewPassword();
    await fireEvent.click(button('Save'));

    expect(await profileUpdate()).toMatchObject({
      current_password: 'oldpassword',
      password: 'hunter2hunter2',
      password_confirmation: 'hunter2hunter2'
    });
  });

  // ! The card owns the whole submit → success → reset loop now, so this is the case that proves
  // ! it closes: nothing above the card calls back into it to finish the job.
  it('leaves edit mode and forgets the passwords once the save lands', async () => {
    await renderCard();
    await startEditing();

    await fillInANewPassword();
    await fireEvent.click(button('Save'));

    await waitFor(() => expect(button('Edit')).toBeTruthy());

    expect(screen.queryByLabelText(/^Current password$/)).toBeNull();

    await startEditing();

    expect(field(/^Current password$/).value).toBe('');
    expect(field(/^New password/).value).toBe('');
  });

  it('keeps an invalid form to itself', async () => {
    await renderCard();
    await startEditing();

    await fireEvent.update(field(/^Email$/), 'not-an-email');
    await fireEvent.click(button('Save'));

    expect(
      await screen.findByText('The email field must be a valid email address.')
    ).toBeTruthy();
    expect(await settledTrace()).not.toContain(PROFILE_UPDATE);
  });

  // ! The errors have to arrive *after* the first render: `useExternalErrors` deliberately omits
  // ! `immediate`, so a value already present when the watcher is created never reaches Regle.
  // ! Coming back from the card's own mutation is exactly that flow. The field is edited and
  // ! submitted first because Regle keeps `$errors` empty until it is dirty.
  it('shows the server’s complaint against the field it names, and stays open to fix it', async () => {
    serverRejects({ email: ['That email is already taken.'] });

    await renderCard();
    await startEditing();

    await fireEvent.update(field(/^Email$/), 'taken@example.com');
    await fireEvent.click(button('Save'));

    expect(
      await screen.findByText('That email is already taken.')
    ).toBeTruthy();

    // ! A rejected save must not reset: the user needs the form as they left it to correct it.
    expect(button('Save')).toBeTruthy();
    expect(field(/^Email$/).value).toBe('taken@example.com');
  });

  // ! The signed-in user already owns their address, so the check has to exclude them — otherwise
  // ! saving a profile whose email never changed would be refused by the form itself. The id comes
  // ! from the store here, unlike the user dialogs where it comes from a prop.
  it('asks the server whether the address is free, ignoring the signed-in user', async () => {
    const asked: URL[] = [];

    server.use(
      http.get(apiUrl('/api/email-availability'), ({ request }) => {
        asked.push(new URL(request.url));

        return HttpResponse.json({ available: true });
      })
    );

    await renderCard();
    await startEditing();

    await fireEvent.update(field(/^Email$/), 'ana.maric@example.com');

    await waitFor(() =>
      expect(asked.at(-1)?.searchParams.get('email')).toBe(
        'ana.maric@example.com'
      )
    );
    expect(asked.at(-1)!.searchParams.get('ignore_id')).toBe(
      String(useAuthStore().user!.id)
    );

    // ! Let the check finish before the test ends — a validation resolving after teardown writes
    // ! into a disposed Regle scope and surfaces as an unhandled rejection. The card has no
    // ! disabled-confirm to wait on, so this waits for the recorder to fall quiet instead.
    await requests.settle();
    await flushPromises();
  });

  it('says the address is confirmed for a verified user', async () => {
    useAuthStore().setUser(
      buildUser({ email_verified_at: '2026-08-01T00:00:00.000000Z' })
    );

    await renderCard();

    // * Both chip strings are always rendered — the inactive one is the ghost reserving the row's width — so this asserts the one that is not aria-hidden.
    expect(screen.getByText('Verified', SHOWN)).toBeTruthy();

    // ! The resend control stays mounted so the row keeps its height, and is made unofferable with `inert` rather than removed. happy-dom does not act on `inert`, so the attribute is what gets asserted here and the visual half is on the browser walk.
    expect(button('Resend email')).toHaveProperty('inert', true);
  });

  it('offers an unverified user another confirmation email, and sends it', async () => {
    await renderCard();

    expect(screen.getByText('Not Verified', SHOWN)).toBeTruthy();

    expect(button('Resend email')).toHaveProperty('inert', false);

    await fireEvent.click(button('Resend email'));

    await waitFor(() =>
      expect(requests.trace()).toContain(
        'POST /email/verification-notification'
      )
    );
  });

  // ! Enter only submits while editing; in the read-only state it must do nothing at all.
  it('does not submit on Enter while the profile is only being read', async () => {
    await renderCard();

    await fireEvent.keyDown(field(/^Name$/), { key: 'Enter' });

    expect(await settledTrace()).not.toContain(PROFILE_UPDATE);
  });

  it('refuses a profile with no name', async () => {
    await renderCard();
    await startEditing();

    await fireEvent.update(field(/^Name$/), '');
    await fireEvent.click(button('Save'));

    expect(await screen.findByText('The name field is required.')).toBeTruthy();
    expect(await settledTrace()).not.toContain(PROFILE_UPDATE);
  });
});
