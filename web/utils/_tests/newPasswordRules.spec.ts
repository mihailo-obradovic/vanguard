// @vitest-environment nuxt
import { describe, it, expect } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent, ref } from 'vue';

import { newPasswordRules } from '../newPasswordRules';

import type { PasswordMode } from '../newPasswordRules';

import type { Ref } from 'vue';

type PasswordForm = { password: string; password_confirmation: string };

// * Driven through a real Regle instance and asserted on validity alone. Asserting the rule objects themselves would only restate @regle/rules; what the forms depend on is which field/mode combinations are allowed to submit.
async function setupForm(mode?: MaybeRefOrGetter<PasswordMode>) {
  const form: Ref<PasswordForm> = ref({
    password: '',
    password_confirmation: ''
  });

  let validate!: () => Promise<boolean>;
  let passwordErrors!: () => string[];
  let confirmationErrors!: () => string[];

  await mountSuspended(
    defineComponent({
      setup() {
        const { r$ } = useRegle(form, () => ({
          ...newPasswordRules(() => form.value.password, mode)
        }));

        validate = async () => (await r$.$validate()).valid;
        passwordErrors = () => r$.password.$errors;
        confirmationErrors = () => r$.password_confirmation.$errors;

        return () => null;
      }
    })
  );

  return { form, validate, passwordErrors, confirmationErrors };
}

describe('newPasswordRules', () => {
  describe("in 'set' mode", () => {
    it('rejects an empty pair', async () => {
      const { validate } = await setupForm();

      expect(await validate()).toBe(false);
    });

    it('flags the password field itself, not only the confirmation', async () => {
      // * The pair is invalid either way; what this pins is which field carries the error, because that is the field the form renders it under.
      const { validate, passwordErrors } = await setupForm();

      await validate();

      expect(passwordErrors()).not.toEqual([]);
    });

    it('accepts a long enough matching pair', async () => {
      const { form, validate } = await setupForm();

      form.value = {
        password: 'correct-horse',
        password_confirmation: 'correct-horse'
      };

      expect(await validate()).toBe(true);
    });

    // * Seven and eight rather than an arbitrary short string: the pair pins the minimum where the backend states it, so a drift to 6 or 7 fails here instead of at a user's submit.
    it('rejects a password under eight characters', async () => {
      const { form, validate } = await setupForm();

      form.value = { password: 'shortpw', password_confirmation: 'shortpw' };

      expect(await validate()).toBe(false);
    });

    it('accepts a password of exactly eight characters', async () => {
      const { form, validate } = await setupForm();

      form.value = { password: 'password', password_confirmation: 'password' };

      expect(await validate()).toBe(true);
    });

    // * Mirrors the backend ceiling, which exists because bcrypt truncates past 72 bytes.
    it('rejects a password over 255 characters', async () => {
      const { form, validate } = await setupForm();
      const password = 'a'.repeat(256);

      form.value = { password, password_confirmation: password };

      expect(await validate()).toBe(false);
    });

    it('accepts a password of exactly 255 characters', async () => {
      const { form, validate } = await setupForm();
      const password = 'a'.repeat(255);

      form.value = { password, password_confirmation: password };

      expect(await validate()).toBe(true);
    });

    it('rejects a confirmation that does not match', async () => {
      const { form, validate } = await setupForm();

      form.value = {
        password: 'correct-horse',
        password_confirmation: 'correct-mouse'
      };

      expect(await validate()).toBe(false);
    });

    it('rejects a missing confirmation', async () => {
      const { form, validate } = await setupForm();

      form.value = { password: 'correct-horse', password_confirmation: '' };

      expect(await validate()).toBe(false);
    });

    it('names the confirmation field in its missing-value message', async () => {
      // * The generic fallback would say "This field is required." — the labeled copy names the field, which is what the forms render.
      const { form, validate, confirmationErrors } = await setupForm();

      form.value = { password: 'correct-horse', password_confirmation: '' };
      await validate();

      expect(confirmationErrors()).toContain(
        'The password confirmation field is required.'
      );
    });

    it('names the password field in its missing-value message', async () => {
      const { validate, passwordErrors } = await setupForm();

      await validate();

      expect(passwordErrors()).toContain('The password field is required.');
    });
  });

  describe("in 'change' mode", () => {
    it('accepts an untouched pair', async () => {
      const { validate } = await setupForm('change');

      expect(await validate()).toBe(true);
    });

    it('requires the confirmation once a password has been typed', async () => {
      const { form, validate } = await setupForm('change');

      form.value = { password: 'correct-horse', password_confirmation: '' };

      expect(await validate()).toBe(false);
    });

    it('still enforces the length and the match', async () => {
      const { form, validate } = await setupForm('change');

      form.value = { password: 'shortpw', password_confirmation: 'shortpw' };

      expect(await validate()).toBe(false);

      form.value = {
        password: 'correct-horse',
        password_confirmation: 'correct-mouse'
      };

      expect(await validate()).toBe(false);
    });

    it('accepts a complete pair', async () => {
      const { form, validate } = await setupForm('change');

      form.value = {
        password: 'correct-horse',
        password_confirmation: 'correct-horse'
      };

      expect(await validate()).toBe(true);
    });

    it('names the new-password fields in its messages', async () => {
      // * A change-password form labels its inputs "New password" / "Confirm new password" — and may show a separate "Current password" input at the same time — so the copy must name the field the user actually sees, not the "password" of a set-password form.
      const { form, validate, passwordErrors, confirmationErrors } =
        await setupForm('change');

      form.value = { password: 'shortpw', password_confirmation: '' };
      await validate();

      expect(passwordErrors()).toContain(
        'The new password field must be at least 8 characters.'
      );

      expect(confirmationErrors()).toContain(
        'The confirm new password field is required.'
      );
    });
  });

  it('re-evaluates when a form switches mode at runtime', async () => {
    // * The create/edit toggle in users.vue passes a getter for exactly this reason.
    const isEditMode = ref(true);
    const { validate } = await setupForm(() =>
      isEditMode.value ? 'change' : 'set'
    );

    expect(await validate()).toBe(true);

    isEditMode.value = false;

    expect(await validate()).toBe(false);
  });

  it('switches the field names in its messages when the mode flips at runtime', async () => {
    const isEditMode = ref(false);
    const { form, validate, passwordErrors } = await setupForm(() =>
      isEditMode.value ? 'change' : 'set'
    );

    form.value = { password: 'shortpw', password_confirmation: 'shortpw' };
    await validate();

    expect(passwordErrors()).toContain(
      'The password field must be at least 8 characters.'
    );

    isEditMode.value = true;
    await validate();

    expect(passwordErrors()).toContain(
      'The new password field must be at least 8 characters.'
    );
  });
});
