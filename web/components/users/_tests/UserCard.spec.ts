// @vitest-environment nuxt
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderSuspended } from '@nuxt/test-utils/runtime';
import { screen, fireEvent, cleanup, waitFor } from '@testing-library/vue';
import { flushPromises } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import { defineComponent, reactive } from 'vue';

import { server } from '@/mocks/server';
import { authHandlers } from '@/mocks/handlers/auth';
import { recordRequests } from '@/mocks/requests';
import { buildUser } from '@/mocks/fixtures';
import { useAuthStore } from '@/stores/useAuthStore';

import UserCard from '../UserCard.vue';

// ! See CookieConsentBanner.spec.ts — Vuetify's overlays reach for this bare global.
vi.stubGlobal('visualViewport', null);

const requests = recordRequests();

type UserCardProps = InstanceType<typeof UserCard>['$props'];

/** Vuetify needs supplying by hand — `renderSuspended` does not run the Nuxt plugin that installs it. */
function renderCard(props: Partial<UserCardProps> = {}) {
  return renderSuspended(UserCard, {
    props,
    global: { plugins: [createVuetify()] }
  });
}

/** An owner that can hand the card a server 422 after the fact, the way a failed mutation does. */
const owner = reactive<{ serverErrors: Record<string, string[]> }>({
  serverErrors: {}
});

const AnOwnedCard = defineComponent({
  components: { UserCard },
  setup() {
    return { owner };
  },
  template: `<UserCard :server-errors="owner.serverErrors" />`
});

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
  await fireEvent.update(field(/^Current Password$/), 'oldpassword');
  await fireEvent.update(field(/^New password/), 'hunter2hunter2');
  await fireEvent.update(field(/^Confirm new password$/), 'hunter2hunter2');
}

describe('UserCard', () => {
  beforeEach(() => {
    owner.serverErrors = {};
    requests.reset();
    server.use(...authHandlers());
    useAuthStore().resetUser();
    useAuthStore().setUser(
      buildUser({ name: 'Ana', email: 'ana@example.com' })
    );
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  it('shows the signed-in user, with nothing to change yet', async () => {
    await renderCard();

    expect(field(/^Name$/).value).toBe('Ana');
    expect(field(/^Name$/).readOnly).toBe(true);
    expect(button('Edit')).toBeTruthy();
    expect(screen.queryByLabelText(/^Current Password$/)).toBeNull();
  });

  it('offers the password fields once editing starts', async () => {
    await renderCard();
    await startEditing();

    expect(field(/^Name$/).readOnly).toBe(false);
    expect(field(/^Current Password$/)).toBeTruthy();
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
    const { emitted } = await renderCard();
    await startEditing();

    await fireEvent.update(field(/^Name$/), 'Ana Marić');
    await fireEvent.keyDown(field(/^Name$/), { key: 'Enter' });

    await waitFor(() => expect(emitted().update).toHaveLength(1));
  });

  // ! Buttons act on Enter themselves; submitting here as well would fire twice on one keypress.
  // ! This pins the outcome, not the mechanism: the source guards on `closest('button, a')`, but
  // ! removing that guard alone changes nothing here, so the button is already swallowing the key.
  // ! Recorded as an accepted survivor rather than asserted through the DOM structure.
  it('leaves Enter to a button that handles it itself', async () => {
    const { emitted } = await renderCard();
    await startEditing();

    await fireEvent.keyDown(button('Save'), { key: 'Enter' });
    await flushPromises();

    expect(emitted().update).toBeUndefined();
  });

  // ! `ProfileUpdateRequest` rejects a password change with no current password, so the form asks
  // ! for it the moment a new one is typed and not before.
  it('asks for the current password only once a new one is typed', async () => {
    const { emitted } = await renderCard();
    await startEditing();

    await fireEvent.update(field(/^New password/), 'hunter2hunter2');
    await fireEvent.update(field(/^Confirm new password$/), 'hunter2hunter2');
    await fireEvent.click(button('Save'));

    expect(await screen.findByText('This field is required.')).toBeTruthy();
    expect(emitted().update).toBeUndefined();
  });

  // ! The backend treats a present `password` as a change request, so sending an empty one would
  // ! fail validation on a rename that never touched the password.
  it('leaves the password out of a rename', async () => {
    const { emitted } = await renderCard();
    await startEditing();

    await fireEvent.update(field(/^Name$/), 'Ana Marić');
    await fireEvent.click(button('Save'));

    await waitFor(() => expect(emitted().update).toHaveLength(1));

    const [form] = emitted().update![0] as [Record<string, unknown>];

    expect(form).toEqual({
      name: 'Ana Marić',
      email: 'ana@example.com',
      current_password: ''
    });
  });

  it('sends both password fields when one is being set', async () => {
    const { emitted } = await renderCard();
    await startEditing();

    await fillInANewPassword();
    await fireEvent.click(button('Save'));

    await waitFor(() => expect(emitted().update).toHaveLength(1));

    const [form] = emitted().update![0] as [Record<string, unknown>];

    expect(form).toMatchObject({
      current_password: 'oldpassword',
      password: 'hunter2hunter2',
      password_confirmation: 'hunter2hunter2'
    });
  });

  it('keeps an invalid form to itself', async () => {
    const { emitted } = await renderCard();
    await startEditing();

    await fireEvent.update(field(/^Email$/), 'not-an-email');
    await fireEvent.click(button('Save'));

    expect(
      await screen.findByText('Please enter a valid email address.')
    ).toBeTruthy();
    expect(emitted().update).toBeUndefined();
  });

  // ! The errors have to arrive *after* the first render: `useExternalErrors` deliberately omits
  // ! `immediate`, so a value already present when the watcher is created never reaches Regle.
  // ! That matches the real flow — the 422 comes back from a submit — and it is also why the
  // ! field is edited and submitted first, since Regle keeps `$errors` empty until it is dirty.
  it('shows the server’s complaint against the field it names', async () => {
    await renderSuspended(AnOwnedCard, {
      global: { plugins: [createVuetify()] }
    });
    await startEditing();

    await fireEvent.update(field(/^Email$/), 'taken@example.com');
    await fireEvent.click(button('Save'));

    owner.serverErrors = { email: ['That email is already taken.'] };

    expect(
      await screen.findByText('That email is already taken.')
    ).toBeTruthy();
  });

  it('says the address is confirmed for a verified user', async () => {
    useAuthStore().setUser(
      buildUser({ email_verified_at: '2026-08-01T00:00:00.000000Z' })
    );

    await renderCard();

    expect(screen.getByText('Verified')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Resend email' })).toBeNull();
  });

  it('offers an unverified user another confirmation email, and sends it', async () => {
    await renderCard();

    expect(screen.getByText('Not Verified')).toBeTruthy();

    await fireEvent.click(button('Resend email'));

    await waitFor(() =>
      expect(requests.trace()).toContain(
        'POST /email/verification-notification'
      )
    );
  });
});
