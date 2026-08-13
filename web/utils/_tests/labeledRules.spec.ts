// @vitest-environment nuxt
import { describe, it, expect, afterEach } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent, ref } from 'vue';
import { email, maxLength, required, withMessage } from '@regle/rules';

import { labeledRules } from '../labeledRules';

import type { Ref } from 'vue';

// * Driven through a real Regle instance, like the newPasswordRules spec: what forms depend on is the message text a field renders, so that is what gets asserted.
async function setupForm() {
  const form: Ref<{ email: string }> = ref({ email: '' });

  let validate!: () => Promise<boolean>;
  let emailErrors!: () => string[];
  let setLocale!: (locale: 'en' | 'sr-Latn' | 'sr-Cyrl') => Promise<void>;

  await mountSuspended(
    defineComponent({
      setup() {
        const { r$ } = useRegle(form, {
          email: labeledRules('common.fields.email', {
            email,
            maxLength: maxLength(255),
            required
          })
        });

        validate = async () => (await r$.$validate()).valid;
        emailErrors = () => r$.email.$errors;
        setLocale = useI18n().setLocale;

        return () => null;
      }
    })
  );

  return { form, validate, emailErrors, setLocale };
}

describe('labeledRules', () => {
  afterEach(async () => {
    // * mountSuspended shares one i18n instance across mounts within the file.
    const { setLocale } = await setupForm();
    await setLocale('en');
  });

  it('names the field in the required message', async () => {
    const { validate, emailErrors } = await setupForm();

    await validate();

    expect(emailErrors()).toContain('The Email field is required.');
  });

  it('names the field and the limit in a parameterized message', async () => {
    const { form, validate, emailErrors } = await setupForm();

    form.value.email = `${'a'.repeat(255)}@example.com`;
    await validate();

    expect(emailErrors()).toContain(
      'The Email field must be at most 255 characters.'
    );
  });

  it('re-resolves both the message and the label when the locale changes', async () => {
    const { validate, emailErrors, setLocale } = await setupForm();

    await validate();
    await setLocale('sr-Latn');

    expect(emailErrors()).toContain('Polje „E-pošta“ je obavezno.');
  });

  it('leaves rules it has no message for untouched', async () => {
    const custom = withMessage(
      (value: unknown) => value === 'regle',
      'Custom message'
    );

    const wrapped = labeledRules('common.fields.email', { custom });

    expect(wrapped.custom).toBe(custom);
  });
});
