import { afterEach, describe, expect, it, vi } from 'vitest';

import { formatDate } from '../formatDate';

const locale = { value: 'en' };

// * `#app/nuxt` is where the auto-imported `useNuxtApp` resolves from.
vi.mock('#app/nuxt', () => ({
  useNuxtApp: () => ({ $i18n: { locale, t: (key: string) => key } })
}));

describe('formatDate', () => {
  afterEach(() => {
    locale.value = 'en';
  });

  it('formats an ISO timestamp as a long date', () => {
    expect(formatDate('2026-08-03T12:34:56.000000Z')).toBe('August 3, 2026');
  });

  it('keeps the UTC date regardless of the time component', () => {
    expect(formatDate('2026-12-31T23:59:59Z')).toBe('December 31, 2026');
  });

  it('follows the active locale for Serbian Latin', () => {
    locale.value = 'sr-Latn';
    expect(formatDate('2026-08-03T12:34:56.000000Z')).toBe('3. avgust 2026.');
  });

  it('follows the active locale for Serbian Cyrillic', () => {
    locale.value = 'sr-Cyrl';
    expect(formatDate('2026-08-03T12:34:56.000000Z')).toBe('3. август 2026.');
  });

  it('falls back for an empty value', () => {
    expect(formatDate('')).toBe('common.notAvailable');
  });
});
