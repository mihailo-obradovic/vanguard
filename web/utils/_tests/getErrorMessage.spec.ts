import { describe, it, expect, vi } from 'vitest';

import { getErrorMessage } from '../getErrorMessage';

// * The fallback goes through the catalog, so the test asserts the key rather than a copy of the English copy. `#app/nuxt` is where the auto-imported `useNuxtApp` resolves from.
vi.mock('#app/nuxt', () => ({
  useNuxtApp: () => ({ $i18n: { t: (key: string) => key } })
}));

describe('getErrorMessage', () => {
  it('prefers the server-provided message from the response body', () => {
    const error = {
      message: '[POST] "/login": 422 Unprocessable Content',
      data: { message: 'These credentials do not match our records.' }
    };

    expect(getErrorMessage(error)).toBe(
      'These credentials do not match our records.'
    );
  });

  it('falls back to the error message when there is no response body', () => {
    const error = { message: 'Failed to fetch' };

    expect(getErrorMessage(error)).toBe('Failed to fetch');
  });

  it('falls back when the body message is only whitespace', () => {
    const error = { message: 'Failed to fetch', data: { message: '   ' } };

    expect(getErrorMessage(error)).toBe('Failed to fetch');
  });

  it('falls back when the body message is not a string', () => {
    const error = { message: 'Failed to fetch', data: { message: 42 } };

    expect(getErrorMessage(error)).toBe('Failed to fetch');
  });

  it('returns a generic message when both messages are blank', () => {
    const error = { message: '  ', data: { message: '' } };

    expect(getErrorMessage(error)).toBe('errors.generic');
  });

  it('returns a generic message when there is no error object at all', () => {
    expect(getErrorMessage(null)).toBe('errors.generic');
  });

  it('returns a generic message for unrecognised errors', () => {
    expect(getErrorMessage({})).toBe('errors.generic');
  });
});
