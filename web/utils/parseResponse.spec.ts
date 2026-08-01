import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';

import { parseResponse } from './parseResponse';

const schema = z.object({ id: z.number(), name: z.string() });

describe('parseResponse', () => {
  it('returns the parsed data when it matches the schema', () => {
    expect(parseResponse(schema, { id: 1, name: 'Mihailo' })).toEqual({
      id: 1,
      name: 'Mihailo'
    });
  });

  it('strips unknown keys so additive backend changes pass through safely', () => {
    expect(
      parseResponse(schema, { id: 1, name: 'Mihailo', extra: true })
    ).toEqual({ id: 1, name: 'Mihailo' });
  });

  it('throws a user-presentable error and logs details on a mismatch', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => parseResponse(schema, { id: 'not-a-number' })).toThrowError(
      'Unexpected response from the server.'
    );
    expect(consoleError).toHaveBeenCalledOnce();

    consoleError.mockRestore();
  });
});
