// @vitest-environment nuxt
import { describe, it, expect } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent, ref } from 'vue';

import { newPasswordRules } from '../newPasswordRules';

import type { Ref } from 'vue';

type PasswordForm = { password: string; password_confirmation: string };

// * Driven through a real Regle instance and asserted on validity alone. Asserting the rule
// * objects themselves would only restate @regle/rules; what the forms depend on is which
// * field/mode combinations are allowed to submit.
async function setupForm(optional?: MaybeRefOrGetter<boolean>) {
  const form: Ref<PasswordForm> = ref({
    password: '',
    password_confirmation: ''
  });

  let validate!: () => Promise<boolean>;
  let passwordErrors!: () => string[];
  let confirmationErrors!: () => string[];
  let t!: (key: string) => string;

  await mountSuspended(
    defineComponent({
      setup() {
        const { r$ } = useRegle(form, () => ({
          ...newPasswordRules(() => form.value.password, optional)
        }));

        validate = async () => (await r$.$validate()).valid;
        passwordErrors = () => r$.password.$errors;
        confirmationErrors = () => r$.password_confirmation.$errors;
        t = useI18n().t;

        return () => null;
      }
    })
  );

  return { form, validate, passwordErrors, confirmationErrors, t };
}

describe('newPasswordRules', () => {
  describe('when a password is required', () => {
    it('rejects an empty pair', async () => {
      const { validate } = await setupForm();

      expect(await validate()).toBe(false);
    });

    it('flags the password field itself, not only the confirmation', async () => {
      // * The pair is invalid either way; what this pins is which field carries the error,
      // * because that is the field the form renders it under.
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

    it('rejects a password under eight characters', async () => {
      const { form, validate } = await setupForm();

      form.value = { password: 'short', password_confirmation: 'short' };

      expect(await validate()).toBe(false);
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

    it('reports the missing confirmation with the catalog message, not the built-in English one', async () => {
      // * `requiredIf` needs its own entry in regle-config.ts — the `required` override does not reach it. The catalog string differs from Regle's built-in fallback, so this fails if that entry is lost.
      const { form, validate, confirmationErrors, t } = await setupForm();

      form.value = { password: 'correct-horse', password_confirmation: '' };
      await validate();

      expect(confirmationErrors()).toContain(t('validation.required'));
    });
  });

  describe('when the password is optional', () => {
    it('accepts an untouched pair', async () => {
      const { validate } = await setupForm(true);

      expect(await validate()).toBe(true);
    });

    it('requires the confirmation once a password has been typed', async () => {
      const { form, validate } = await setupForm(true);

      form.value = { password: 'correct-horse', password_confirmation: '' };

      expect(await validate()).toBe(false);
    });

    it('still enforces the length and the match', async () => {
      const { form, validate } = await setupForm(true);

      form.value = { password: 'short', password_confirmation: 'short' };

      expect(await validate()).toBe(false);

      form.value = {
        password: 'correct-horse',
        password_confirmation: 'correct-mouse'
      };

      expect(await validate()).toBe(false);
    });

    it('accepts a complete pair', async () => {
      const { form, validate } = await setupForm(true);

      form.value = {
        password: 'correct-horse',
        password_confirmation: 'correct-horse'
      };

      expect(await validate()).toBe(true);
    });
  });

  it('re-evaluates when a form switches mode at runtime', async () => {
    // * The create/edit toggle in users.vue passes a getter for exactly this reason.
    const isEditMode = ref(true);
    const { validate } = await setupForm(() => isEditMode.value);

    expect(await validate()).toBe(true);

    isEditMode.value = false;

    expect(await validate()).toBe(false);
  });
});
