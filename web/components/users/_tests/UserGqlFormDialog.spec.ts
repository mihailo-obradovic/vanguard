// @vitest-environment nuxt
import { describe, it, expect, afterEach } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { screen, fireEvent, cleanup, waitFor } from '@testing-library/vue';

import { buildUser } from '@/mocks/fixtures';

import FormDialog from '@/components/_shared/FormDialog.vue';
import { Select } from '@/components/ui/select';

import UserGqlFormDialog from '../UserGqlFormDialog.vue';

import type { User } from '@/types/auth';
import type { UpdateUserGqlInput } from '@/types/user';

/**
 * Mount the dialog with reactive props, the way the demo page owns them.
 *
 * * No MSW handler needed, unlike the REST form's: this form mirrors the GraphQL validator, which
 * * has no availability check, so nothing leaves the app while the user types.
 */
async function mountDialog(user: User | null) {
  const subject = ref<User | null>(user);
  const serverErrors = ref<Record<string, string[]>>({});
  const updates: UpdateUserGqlInput[] = [];
  const closes: true[] = [];

  const page = defineComponent({
    setup() {
      return () =>
        h(UserGqlFormDialog, {
          user: subject.value,
          submitting: false,
          serverErrors: serverErrors.value,
          onUpdate: (input: UpdateUserGqlInput) => updates.push(input),
          onClose: () => closes.push(true)
        });
    }
  });

  // * `mountSuspended` rather than `renderSuspended` so the specs can reach the two controls that
  // * are no longer plain DOM — see `submit` and `pickRole`. Testing Library's `screen` queries the
  // * document either way, so every other query is unaffected.
  const wrapper = await mountSuspended(page);

  wrappers.push(wrapper);

  return { subject, serverErrors, updates, closes, wrapper };
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
 * ! `FormDialog` has no form element — its actions sit in the dialog footer, outside any — so the
 * ! equivalent seam is the confirm it emits, which is what Enter and the footer button both reach
 * ! `handleSubmit` through. Confirming also exercises the handler's own guard rather than only the
 * ! button's disabled state.
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

/**
 * Long enough for a pending `$validate()` to have resolved.
 *
 * ! Asserting an absence right after the error message renders proves nothing: the message appears
 * ! while `$validate()` is still settling, so an emit that should not happen has not had its
 * ! chance yet. The mutation audit caught exactly that.
 */
function settleValidation() {
  return new Promise((resolve) => setTimeout(resolve, 300));
}

/** What the role control shows — the trigger's label, not a native select's value. */
function shownRole() {
  return screen.getByLabelText('Role').textContent?.trim();
}

describe('UserGqlFormDialog', () => {
  afterEach(() => {
    wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
    cleanup();
  });

  // ! The subject is the open state here — one fact, one prop. A separate flag could disagree with it.
  it('stays closed while there is no user to edit', async () => {
    await mountDialog(null);

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens on the user it is given, named in the title', async () => {
    await mountDialog(
      buildUser({ id: 7, name: 'Ada', email: 'ada@example.com' })
    );

    expect(screen.getByRole('dialog', { name: 'Edit Ada' })).toBeTruthy();
    expect(field('Name').value).toBe('Ada');
    expect(field('Email').value).toBe('ada@example.com');
  });

  // ! The partial-update contract: an omitted GraphQL variable never reaches the resolver, so
  // ! sending only the diff is what stops two editors overwriting each other with stale snapshots.
  it('sends only the fields that actually changed', async () => {
    const { updates, wrapper } = await mountDialog(
      buildUser({ id: 7, name: 'Ada', email: 'ada@example.com', role: 'user' })
    );

    await fireEvent.update(field('Name'), 'Ada Lovelace');

    await submit(wrapper);

    await waitFor(() => expect(updates).toHaveLength(1));
    expect(updates[0]).toEqual({ id: 7, name: 'Ada Lovelace' });
  });

  it('sends the id alone when nothing was touched', async () => {
    const { updates, wrapper } = await mountDialog(
      buildUser({ id: 7, name: 'Ada' })
    );

    await submit(wrapper);

    await waitFor(() => expect(updates).toHaveLength(1));
    expect(updates[0]).toEqual({ id: 7 });
  });

  it('shows the role on the picker, as held and as picked', async () => {
    const { wrapper } = await mountDialog(buildUser({ id: 7, role: 'user' }));

    expect(shownRole()).toBe('User');

    await pickRole(wrapper, 'admin');

    expect(shownRole()).toBe('Admin');
  });

  it('sends a changed role', async () => {
    const { updates, wrapper } = await mountDialog(
      buildUser({ id: 7, name: 'Ada', role: 'user' })
    );

    await pickRole(wrapper, 'admin');

    await submit(wrapper);

    await waitFor(() => expect(updates).toHaveLength(1));
    expect(updates[0]).toEqual({ id: 7, role: 'admin' });
  });

  // ! Opening on the next subject rather than the last is what keeps the title and the fields
  // ! describing the same person.
  it('re-seeds on the next subject', async () => {
    const { subject } = await mountDialog(buildUser({ id: 1, name: 'Ada' }));

    await fireEvent.update(field('Name'), 'abandoned edit');

    subject.value = null;
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    subject.value = buildUser({ id: 2, name: 'Grace' });

    await waitFor(() => expect(field('Name').value).toBe('Grace'));
    expect(screen.getByRole('dialog', { name: 'Edit Grace' })).toBeTruthy();
  });

  it('does not emit an update the rules reject', async () => {
    const { updates, wrapper } = await mountDialog(
      buildUser({ id: 7, name: 'Ada' })
    );

    await fireEvent.update(field('Email'), 'not-an-email');

    await submit(wrapper);

    await waitFor(() =>
      expect(
        screen.getByText('The email field must be a valid email address.')
      ).toBeTruthy()
    );

    await settleValidation();

    expect(updates).toHaveLength(0);
  });

  it('names the field when the name is emptied', async () => {
    const { updates, wrapper } = await mountDialog(
      buildUser({ id: 7, name: 'Ada' })
    );

    await fireEvent.update(field('Name'), '');

    await submit(wrapper);

    await waitFor(() =>
      expect(screen.getByText('The name field is required.')).toBeTruthy()
    );

    await settleValidation();

    expect(updates).toHaveLength(0);
  });

  it('renders the server verdict on the field it names', async () => {
    const { serverErrors, updates, wrapper } = await mountDialog(
      buildUser({ id: 7, name: 'Ada' })
    );

    await submit(wrapper);
    await waitFor(() => expect(updates).toHaveLength(1));

    serverErrors.value = { email: ['The email has already been taken.'] };

    await waitFor(() =>
      expect(screen.getByText('The email has already been taken.')).toBeTruthy()
    );
  });

  // * Escape is the dialog primitive's, but the page only hears about it because this dialog forwards it.
  it("forwards the dialog's own close request", async () => {
    const { closes } = await mountDialog(buildUser({ id: 7 }));

    await fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(closes).toHaveLength(1);
  });

  it('asks to close when Cancel is pressed', async () => {
    const { closes } = await mountDialog(buildUser({ id: 7 }));

    await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(closes).toHaveLength(1);
  });
});
