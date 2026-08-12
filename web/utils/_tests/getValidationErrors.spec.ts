import { describe, it, expect } from 'vitest';

import { getValidationErrors } from '../getValidationErrors';

import type { FetchError } from 'ofetch';

describe('getValidationErrors', () => {
  it('maps Laravel 422 errors to field-keyed message arrays', () => {
    const error = {
      data: {
        message: 'The email has already been taken.',
        errors: {
          email: ['The email has already been taken.'],
          password: [
            'The password field is required.',
            'The password must be at least 8 characters.'
          ]
        }
      }
    } as FetchError;

    expect(getValidationErrors(error)).toEqual({
      email: ['The email has already been taken.'],
      password: [
        'The password field is required.',
        'The password must be at least 8 characters.'
      ]
    });
  });

  it('returns an empty object when the body has no errors', () => {
    expect(getValidationErrors({} as FetchError)).toEqual({});
    expect(
      getValidationErrors({ data: { message: 'Server error' } } as FetchError)
    ).toEqual({});
  });

  it('drops non-string messages and fields left without any', () => {
    const error = {
      data: {
        errors: {
          email: ['The email field is required.', 42],
          name: 'not-an-array'
        }
      }
    } as FetchError;

    expect(getValidationErrors(error)).toEqual({
      email: ['The email field is required.']
    });
  });
});
