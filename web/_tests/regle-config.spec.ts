// @vitest-environment nuxt
import { describe, it, expect } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent, ref } from 'vue';
import {
  email,
  maxLength,
  minLength,
  required,
  requiredIf,
  sameAs
} from '@regle/rules';

type Field = 'nickname' | 'motto' | 'handle' | 'bio' | 'contact' | 'repeated';

// * The setup file replaces the English messages @regle/rules ships with. Fields wrapped in labeledRules carry their own copy; these are the fallbacks a bare rule gets. `requiredIf` matters here: messages are matched by the declared rule key, so without its own entry it would fall back to the library's hardcoded English instead of the catalog.
async function setupForm() {
  const form = ref({
    nickname: '',
    motto: '',
    handle: 'ab',
    bio: 'x'.repeat(9),
    contact: 'not-an-address',
    repeated: 'something else'
  });

  let validate!: () => Promise<boolean>;
  let errors!: (field: Field) => string[];

  await mountSuspended(
    defineComponent({
      setup() {
        const { r$ } = useRegle(form, {
          motto: { requiredIf: requiredIf(() => true) },
          nickname: { required },
          handle: { minLength: minLength(5) },
          bio: { maxLength: maxLength(8) },
          contact: { email },
          repeated: { sameAs: sameAs(() => 'the original') }
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

  // ! The length rules are the only two whose message interpolates a value, and they read it off
  // ! `$params` — a message that renders the bound as `{min}` is still a passing message to a test
  // ! that only checks the rule fired, so the number itself is what these assert.
  it('names the shortest allowed length in the minLength message', async () => {
    const { validate, errors } = await setupForm();

    await validate();

    expect(errors('handle')).toContain(
      'This field must be at least 5 characters.'
    );
  });

  it('names the longest allowed length in the maxLength message', async () => {
    const { validate, errors } = await setupForm();

    await validate();

    expect(errors('bio')).toContain('This field must be at most 8 characters.');
  });

  // * The labelled variants of these two are covered through `labeledRules` and
  // * `newPasswordRules`; these are the bare fallbacks, which nothing else reaches.
  it('gives a bare email rule the catalog message', async () => {
    const { validate, errors } = await setupForm();

    await validate();

    expect(errors('contact')).toContain('Please enter a valid email address.');
  });

  it('gives a bare sameAs rule the catalog message', async () => {
    const { validate, errors } = await setupForm();

    await validate();

    expect(errors('repeated')).toContain('The values do not match.');
  });
});
