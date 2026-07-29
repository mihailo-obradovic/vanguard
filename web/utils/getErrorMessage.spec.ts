import { describe, it, expect } from 'vitest';

import { getErrorMessage } from './getErrorMessage';

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

  it('returns a generic message for unrecognised errors', () => {
    expect(getErrorMessage({})).toBe('Something went wrong. Please try again.');
  });
});
