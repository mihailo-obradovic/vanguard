// @vitest-environment nuxt
import { describe, it, expect } from 'vitest';
import { ref } from 'vue';
import { FetchError } from 'ofetch';

import { useValidationErrors } from '../useValidationErrors';

/** A 422 shaped the way Laravel answers one. */
function validationFailure(errors: Record<string, string[]>) {
  const error = new FetchError('422 Unprocessable Content');

  error.data = { errors };

  return error;
}

describe('useValidationErrors', () => {
  it('derives the field-keyed errors from a failed mutation', () => {
    const error = ref(validationFailure({ email: ['That email is taken.'] }));

    expect(useValidationErrors(error).value).toEqual({
      email: ['That email is taken.']
    });
  });

  // * The `{}` matters as much as the errors do: it is what a form binds to before anything has
  // * failed, and `undefined` there would leave Regle without its external-errors object.
  it('gives an empty map while nothing has failed', () => {
    expect(useValidationErrors(ref(null)).value).toEqual({});
    expect(useValidationErrors(ref(undefined)).value).toEqual({});
  });

  it('follows the mutation as it fails and recovers', () => {
    const error = ref<FetchError | null>(null);
    const errors = useValidationErrors(error);

    expect(errors.value).toEqual({});

    error.value = validationFailure({ name: ['Required.'] });

    expect(errors.value).toEqual({ name: ['Required.'] });

    error.value = null;

    expect(errors.value).toEqual({});
  });

  // ! A non-422 failure reaches this the same way a 422 does — it must not invent fields from a
  // ! payload that has none, or the form would show errors nothing can clear.
  it('yields nothing for a failure that carries no validation payload', () => {
    const error = ref(new FetchError('500 Internal Server Error'));

    expect(useValidationErrors(error).value).toEqual({});
  });
});
