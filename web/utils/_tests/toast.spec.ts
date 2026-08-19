// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';

import { $toast } from '../toast';

const { add, useToast } = vi.hoisted(() => {
  const add = vi.fn<(payload: Record<string, unknown>) => void>();

  return { add, useToast: vi.fn<() => { add: typeof add }>(() => ({ add })) };
});

mockNuxtImport('useToast', () => useToast);

describe('$toast', () => {
  beforeEach(() => {
    add.mockClear();
    useToast.mockClear();
  });

  it('treats a message with no stated type as a success', () => {
    $toast('Saved.');

    expect(add).toHaveBeenCalledWith({ title: 'Saved.', color: 'success' });
  });

  // ! The colour is the whole signal a toast carries — an error shown in the success colour reads
  // ! as the opposite of what happened.
  it('maps each type name to its colour', () => {
    const expected = {
      success: 'success',
      error: 'error',
      default: 'neutral',
      info: 'info',
      warning: 'warning'
    } as const;

    for (const [name, color] of Object.entries(expected)) {
      $toast('Message', name as keyof typeof expected);

      expect(add).toHaveBeenLastCalledWith({ title: 'Message', color });
    }
  });

  it('passes caller options through alongside the colour', () => {
    $toast('Message', 'info', { duration: 1000 });

    expect(add).toHaveBeenCalledWith({
      title: 'Message',
      color: 'info',
      duration: 1000
    });
  });

  it('resolves the toast interface per call, never at module scope', () => {
    $toast('First');
    $toast('Second');

    // * `<UApp>` provides the interface after this module is imported, so caching it once would
    // * capture an uninstalled one.
    expect(useToast).toHaveBeenCalledTimes(2);
  });
});
