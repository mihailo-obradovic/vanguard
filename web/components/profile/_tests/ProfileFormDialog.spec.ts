// @vitest-environment nuxt
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { renderSuspended } from '@nuxt/test-utils/runtime';
import { http, HttpResponse } from 'msw';
import { screen, fireEvent, cleanup, waitFor } from '@testing-library/vue';

import { server } from '@/mocks/server';
import { apiUrl } from '@/mocks/api';
import { buildUser } from '@/mocks/fixtures';

import ProfileFormDialog from '../ProfileFormDialog.vue';

import type { User } from '@/types/auth';
import type { ProfileForm } from '@/types/user';

const OWN_EMAIL = 'mihailo@example.com';

/** Mount the dialog with reactive props, the way the profile page owns them. */
async function mountDialog(user: User = buildUser({ id: 3 })) {
  const open = ref(true);
  const subject = ref<User>(user);
  const serverErrors = ref<Record<string, string[]>>({});
  const submitted: ProfileForm[] = [];
  const closes: true[] = [];

  const page = defineComponent({
    setup() {
      return () =>
        h(ProfileFormDialog, {
          open: open.value,
          user: subject.value,
          submitting: false,
          serverErrors: serverErrors.value,
          onSubmit: (payload: ProfileForm) => submitted.push(payload),
          onClose: () => closes.push(true)
        });
    }
  });

  await renderSuspended(page);

  return { open, subject, serverErrors, submitted, closes };
}

function field(label: string) {
  return screen.getByLabelText(label) as HTMLInputElement;
}

function submit() {
  return fireEvent.submit(document.querySelector('form') as HTMLFormElement);
}

/** Past the email field's 500ms debounce, so a pending `$validate()` has resolved. */
function settleValidation() {
  return new Promise((resolve) => setTimeout(resolve, 700));
}

async function submitAndSettle(submitted: ProfileForm[]) {
  await submit();

  await waitFor(() => expect(submitted).toHaveLength(1));
}

describe('ProfileFormDialog', () => {
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

  it('seeds itself from the signed-in user, with the password fields empty', async () => {
    await mountDialog(buildUser({ id: 3, name: 'Mihailo', email: OWN_EMAIL }));

    expect(field('Name').value).toBe('Mihailo');
    expect(field('Email').value).toBe(OWN_EMAIL);
    expect(
      field('Current password (required when changing password)').value
    ).toBe('');
    expect(field('New password (leave empty to keep current)').value).toBe('');
  });

  // ! The narrower half of the contract: a profile update that is not a password change must not
  // ! carry a present-but-empty current_password, which the backend rejects outright.
  it('sends only the name and email when no new password was set', async () => {
    const { submitted } = await mountDialog(
      buildUser({ id: 3, name: 'Mihailo', email: OWN_EMAIL })
    );

    await fireEvent.update(field('Name'), 'Mihailo Obradović');

    await submitAndSettle(submitted);

    expect(submitted[0]).toEqual({
      name: 'Mihailo Obradović',
      email: OWN_EMAIL
    });
  });

  it('sends the challenge and the pair when a new password was set', async () => {
    const { submitted } = await mountDialog(
      buildUser({ id: 3, name: 'Mihailo', email: OWN_EMAIL })
    );

    await fireEvent.update(
      field('Current password (required when changing password)'),
      'currentone'
    );
    await fireEvent.update(
      field('New password (leave empty to keep current)'),
      'gmaz1234'
    );
    await fireEvent.update(
      field('Confirm new password (required if changing password)'),
      'gmaz1234'
    );

    await submitAndSettle(submitted);

    expect(submitted[0]).toEqual({
      name: 'Mihailo',
      email: OWN_EMAIL,
      current_password: 'currentone',
      password: 'gmaz1234',
      password_confirmation: 'gmaz1234'
    });
  });

  // ! The challenge is what authorizes the change; without this rule the form would let the user
  // ! submit a new password and meet a 422 it could have prevented.
  it('refuses a new password with no current password to authorize it', async () => {
    const { submitted } = await mountDialog();

    await fireEvent.update(
      field('New password (leave empty to keep current)'),
      'gmaz1234'
    );
    await fireEvent.update(
      field('Confirm new password (required if changing password)'),
      'gmaz1234'
    );

    await submit();

    await waitFor(() =>
      expect(
        screen.getByText('The current password field is required.')
      ).toBeTruthy()
    );

    await settleValidation();

    expect(submitted).toHaveLength(0);
  });

  it('refuses a confirmation that does not match the new password', async () => {
    const { submitted } = await mountDialog();

    await fireEvent.update(
      field('Current password (required when changing password)'),
      'currentone'
    );
    await fireEvent.update(
      field('New password (leave empty to keep current)'),
      'gmaz1234'
    );
    await fireEvent.update(
      field('Confirm new password (required if changing password)'),
      'gmaz9999'
    );

    await submit();

    await waitFor(() =>
      expect(
        screen.getByText('The confirm new password field does not match.')
      ).toBeTruthy()
    );

    await settleValidation();

    expect(submitted).toHaveLength(0);
  });

  // ! Without the id, keeping your own address on the form reads as "already taken".
  it('excludes the signed-in user from the availability check', async () => {
    const asked: (string | null)[] = [];

    server.use(
      http.get(apiUrl('/api/email-availability'), ({ request }) => {
        asked.push(new URL(request.url).searchParams.get('ignore_id'));

        return HttpResponse.json({ available: true });
      })
    );

    await mountDialog(buildUser({ id: 3, email: OWN_EMAIL }));

    await fireEvent.update(field('Email'), OWN_EMAIL);

    // * The count is not the point and is not stable: seeding the field and then editing it both
    // * trigger the debounced rule. Every call has to carry the id.
    await waitFor(() => expect(asked.length).toBeGreaterThan(0));
    expect(asked.every((id) => id === '3')).toBe(true);
  });

  it('renders the server verdict on the field it names', async () => {
    const { serverErrors, submitted } = await mountDialog();

    await submitAndSettle(submitted);

    serverErrors.value = {
      current_password: ['The current password is incorrect.']
    };

    await waitFor(() =>
      expect(
        screen.getByText('The current password is incorrect.')
      ).toBeTruthy()
    );
  });

  // ! A reopened form must not still be holding the password the user typed last time, nor the
  // ! verdict the server returned about it.
  it('drops what was typed last time when it is reopened', async () => {
    const { open } = await mountDialog(buildUser({ id: 3, name: 'Mihailo' }));

    await fireEvent.update(field('Name'), 'abandoned edit');
    await fireEvent.update(
      field('New password (leave empty to keep current)'),
      'gmaz1234'
    );

    open.value = false;
    await waitFor(() => expect(screen.queryByLabelText('Name')).toBeNull());

    open.value = true;

    await waitFor(() => expect(field('Name').value).toBe('Mihailo'));
    expect(field('New password (leave empty to keep current)').value).toBe('');
  });

  it('names the field when the name is emptied', async () => {
    const { submitted } = await mountDialog();

    await fireEvent.update(field('Name'), '');

    await submit();

    await waitFor(() =>
      expect(screen.getByText('The name field is required.')).toBeTruthy()
    );

    await settleValidation();

    expect(submitted).toHaveLength(0);
  });

  it('asks to close when Cancel is pressed', async () => {
    const { closes } = await mountDialog();

    await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(closes).toHaveLength(1);
  });
});
