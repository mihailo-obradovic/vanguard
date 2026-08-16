// @vitest-environment nuxt
import { describe, it, expect } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent, ref } from 'vue';

import { nameRules } from '../nameRules';

import type { Ref } from 'vue';

// * Driven through a real Regle instance and asserted on validity and the message a user reads. Asserting the rule objects themselves would only restate @regle/rules.
async function setupForm() {
  const form: Ref<{ name: string }> = ref({ name: '' });

  let validate!: () => Promise<boolean>;
  let nameErrors!: () => string[];

  await mountSuspended(
    defineComponent({
      setup() {
        const { r$ } = useRegle(form, () => ({ ...nameRules() }));

        validate = async () => (await r$.$validate()).valid;
        nameErrors = () => r$.name.$errors;

        return () => null;
      }
    })
  );

  return { form, validate, nameErrors };
}

describe('nameRules', () => {
  it('requires a name', async () => {
    const { validate } = await setupForm();

    expect(await validate()).toBe(false);
  });

  it('accepts a name', async () => {
    const { form, validate } = await setupForm();

    form.value.name = 'Ada Lovelace';

    expect(await validate()).toBe(true);
  });

  // * Mirrors the backend's `max:255` — the boundary on both sides, so an off-by-one moves the test.
  it('accepts a name of exactly 255 characters', async () => {
    const { form, validate } = await setupForm();

    form.value.name = 'a'.repeat(255);

    expect(await validate()).toBe(true);
  });

  it('refuses a name of 256 characters', async () => {
    const { form, validate } = await setupForm();

    form.value.name = 'a'.repeat(256);

    expect(await validate()).toBe(false);
  });

  // ! The reason this factory exists rather than four inline copies: the message names the field, so a form no longer mixes the generic voice with the labelled one its email and password rules already use.
  it('names the field in its message', async () => {
    const { validate, nameErrors } = await setupForm();

    await validate();

    expect(nameErrors()).toContain('The name field is required.');
  });
});
