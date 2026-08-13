// @vitest-environment nuxt
import { describe, it, expect } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent, ref } from 'vue';
import { required, requiredIf } from '@regle/rules';

// * The setup file replaces the English messages @regle/rules ships with. Fields wrapped in labeledRules carry their own copy; these are the fallbacks a bare rule gets. `requiredIf` matters here: messages are matched by the declared rule key, so without its own entry it would fall back to the library's hardcoded English instead of the catalog.
async function setupForm() {
  const form = ref({ nickname: '', motto: '' });

  let validate!: () => Promise<boolean>;
  let errors!: (field: 'nickname' | 'motto') => string[];

  await mountSuspended(
    defineComponent({
      setup() {
        const { r$ } = useRegle(form, {
          motto: { requiredIf: requiredIf(() => true) },
          nickname: { required }
        });

        validate = async () => (await r$.$validate()).valid;
        errors = (field) => r$[field].$errors;

        return () => null;
      }
    })
  );

  return { validate, errors };
}

describe('regle-config', () => {
  it('gives a bare required rule the catalog message', async () => {
    const { validate, errors } = await setupForm();

    await validate();

    expect(errors('nickname')).toContain('This field is required.');
  });

  it('gives a bare requiredIf rule the catalog message, not the built-in English one', async () => {
    const { validate, errors } = await setupForm();

    await validate();

    expect(errors('motto')).toContain('This field is required.');
  });
});
