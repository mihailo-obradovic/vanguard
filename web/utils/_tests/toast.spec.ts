import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TYPE } from 'vue-toastification';

import { $toast } from '../toast';

// * Only `useToast` is replaced — TYPE stays real so the test asserts the mapping against the
// * library's own constants rather than against a copy of them.
const { toast, useToast } = vi.hoisted(() => {
  const toast = vi.fn<(...args: unknown[]) => void>();

  return { toast, useToast: vi.fn<() => typeof toast>(() => toast) };
});

vi.mock('vue-toastification', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-toastification')>()),
  useToast
}));

describe('$toast', () => {
  beforeEach(() => {
    toast.mockClear();
    useToast.mockClear();
  });

  it('treats a message with no stated type as a success', () => {
    $toast('Saved.');

    expect(toast).toHaveBeenCalledWith('Saved.', { type: TYPE.SUCCESS });
  });

  it('maps each type name to the library constant', () => {
    const expected = {
      success: TYPE.SUCCESS,
      error: TYPE.ERROR,
      default: TYPE.DEFAULT,
      info: TYPE.INFO,
      warning: TYPE.WARNING
    } as const;

    for (const [name, type] of Object.entries(expected)) {
      $toast('Message', name as keyof typeof expected);

      expect(toast).toHaveBeenLastCalledWith('Message', { type });
    }
  });

  it('passes caller options through alongside the type', () => {
    $toast('Message', 'info', { timeout: 1000 });

    expect(toast).toHaveBeenCalledWith('Message', {
      type: TYPE.INFO,
      timeout: 1000
    });
  });

  it('resolves the toast interface per call, never at module scope', () => {
    $toast('First');
    $toast('Second');

    // * The plugin installs the interface after this module is imported, so caching it once
    // * would capture an uninstalled one.
    expect(useToast).toHaveBeenCalledTimes(2);
  });
});
