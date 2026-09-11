import { describe, it, expect, vi, beforeEach } from 'vitest';

import { $toast } from '../toast';

// * vue-sonner's `toast` is callable and carries a method per type, so the double has to be both.
const { toast } = vi.hoisted(() => ({
  toast: Object.assign(vi.fn<(...args: unknown[]) => void>(), {
    success: vi.fn<(...args: unknown[]) => void>(),
    error: vi.fn<(...args: unknown[]) => void>(),
    info: vi.fn<(...args: unknown[]) => void>(),
    warning: vi.fn<(...args: unknown[]) => void>()
  })
}));

vi.mock('vue-sonner', () => ({ toast }));

describe('$toast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('treats a message with no stated type as a success', () => {
    $toast('Saved.');

    expect(toast.success).toHaveBeenCalledWith('Saved.', {});
  });

  it('routes each type name to the library method that carries its icon', () => {
    $toast('Message', 'success');
    $toast('Message', 'error');
    $toast('Message', 'info');
    $toast('Message', 'warning');

    expect(toast.success).toHaveBeenCalledWith('Message', {});
    expect(toast.error).toHaveBeenCalledWith('Message', {});
    expect(toast.info).toHaveBeenCalledWith('Message', {});
    expect(toast.warning).toHaveBeenCalledWith('Message', {});
  });

  it('raises an untyped toast through the callable itself', () => {
    $toast('Message', 'default');

    expect(toast).toHaveBeenCalledWith('Message', {});
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('passes caller options through to the library', () => {
    $toast('Message', 'info', { duration: 1000 });

    expect(toast.info).toHaveBeenCalledWith('Message', { duration: 1000 });
  });
});
