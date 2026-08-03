import { describe, expect, it } from 'vitest';

import { formatDate } from './formatDate';

describe('formatDate', () => {
  it('formats an ISO timestamp as a long date', () => {
    expect(formatDate('2026-08-03T12:34:56.000000Z')).toBe('August 3, 2026');
  });

  it('keeps the UTC date regardless of the time component', () => {
    expect(formatDate('2026-12-31T23:59:59Z')).toBe('December 31, 2026');
  });

  it('falls back for an empty value', () => {
    expect(formatDate('')).toBe('N/A');
  });
});
