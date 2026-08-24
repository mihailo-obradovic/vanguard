// @vitest-environment nuxt
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderSuspended } from '@nuxt/test-utils/runtime';
import { screen, fireEvent, cleanup, waitFor } from '@testing-library/vue';
import { flushPromises } from '@vue/test-utils';

import { http, HttpResponse } from 'msw';

import { server } from '@/mocks/server';
import { apiUrl } from '@/mocks/api';
import { authHandlers } from '@/mocks/handlers/auth';
import { recordRequests } from '@/mocks/requests';
import { buildUser } from '@/mocks/fixtures';

import UserCardContent from '../UserCardContent.vue';

const requests = recordRequests();

const PROFILE_UPDATE = 'PUT /api/profile';

const ANA = buildUser({ name: 'Ana', email: 'ana@example.com' });

function renderCard() {
  return renderSuspended(UserCardContent, { props: { user: ANA } });
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

async function settledTrace() {
  await requests.settle();

  return requests.trace();
}

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

// * The Save button sits in the card header and reaches its form by `form=`, which jsdom does not wire up on click — so the form is submitted directly, as the dialog specs do.
function submit() {
  return fireEvent.submit(document.querySelector('form') as HTMLFormElement);
}

async function startEditing() {
  await fireEvent.click(button('Edit'));

  await waitFor(() => expect(button('Save')).toBeTruthy());
}

async function fillInANewPassword() {
  await fireEvent.update(field(/^Current password$/), 'oldpassword');
  await fireEvent.update(field(/^New password/), 'hunter2hunter2');
  await fireEvent.update(field(/^Confirm new password/), 'hunter2hunter2');
}

describe('UserCardContent', () => {
  beforeEach(() => {
    requests.reset();
    // * The email rules ask whether the address is free the moment one is typed, so every spec needs the endpoint answered — otherwise the request fails the run as unhandled.
    server.use(
      ...authHandlers(),
      http.get(apiUrl('/api/email-availability'), () =>
        HttpResponse.json({ available: true })
      )
    );
  });

  afterEach(async () => {
    await flushPromises();
    cleanup();
    document.body.innerHTML = '';
  });

  it('shows the user, with nothing to change yet', async () => {
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

  // ! The Escape listener is on the window rather than the card, so it still cancels once focus has moved off — a user who tabbed away and changed their mind should not be stuck in an edit they cannot leave without the mouse.
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

  it('asks for the current password only once a new one is typed', async () => {
    await renderCard();
    await startEditing();

    await fireEvent.update(field(/^New password/), 'hunter2hunter2');
    await submit();

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
    await submit();

    expect(await profileUpdate()).toEqual({
      name: 'Ana Marić',
      email: 'ana@example.com'
    });
  });

  it('sends both password fields when one is being set', async () => {
    await renderCard();
    await startEditing();

    await fillInANewPassword();
    await submit();

    expect(await profileUpdate()).toMatchObject({
      current_password: 'oldpassword',
      password: 'hunter2hunter2',
      password_confirmation: 'hunter2hunter2'
    });
  });

  // ! The card owns the whole submit → success → reset loop, so this is the case that proves it closes: nothing above the card calls back into it to finish the job.
  it('leaves edit mode and forgets the passwords once the save lands', async () => {
    await renderCard();
    await startEditing();

    await fillInANewPassword();
    await submit();

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
    await submit();

    expect(
      await screen.findByText('The email field must be a valid email address.')
    ).toBeTruthy();
    expect(await settledTrace()).not.toContain(PROFILE_UPDATE);
  });

  // ! The errors have to arrive *after* the first render: `useExternalErrors` deliberately omits `immediate`, so a value already present when the watcher is created never reaches Regle. Coming back from the card's own mutation is exactly that flow.
  it('shows the server’s complaint against the field it names, and stays open to fix it', async () => {
    serverRejects({ email: ['That email is already taken.'] });

    await renderCard();
    await startEditing();

    await fireEvent.update(field(/^Email$/), 'taken@example.com');
    await submit();

    expect(
      await screen.findByText('That email is already taken.')
    ).toBeTruthy();

    // ! A rejected save must not reset: the user needs the form as they left it to correct it.
    await waitFor(() => expect(button('Save')).toBeTruthy());
    expect(field(/^Email$/).value).toBe('taken@example.com');
  });

  // ! The user already owns their address, so the check has to exclude them — otherwise saving a profile whose email never changed would be refused by the form itself.
  it('asks the server whether the address is free, ignoring the user being edited', async () => {
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

    expect(asked.at(-1)?.searchParams.get('ignore_id')).toBe(String(ANA.id));
  });

  it('refuses a profile with no name', async () => {
    await renderCard();
    await startEditing();

    await fireEvent.update(field(/^Name$/), '');
    await submit();

    expect(await screen.findByText('The name field is required.')).toBeTruthy();
    expect(await settledTrace()).not.toContain(PROFILE_UPDATE);
  });
});
