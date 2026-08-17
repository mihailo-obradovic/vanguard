import { describe, it, expect } from 'vitest';

import { chainAfter } from '../chainAfter';

/** Yield to the macrotask queue, so an unawaited promise has time to be observed out of order. */
function tick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('chainAfter', () => {
  it('runs the internal hook before the caller supplied one', async () => {
    const order: string[] = [];

    await chainAfter(
      () => order.push('internal'),
      () => order.push('caller')
    )();

    expect(order).toEqual(['internal', 'caller']);
  });

  // ! The reason this exists. Without the `await`, a caller reading the store or the cache in its
  // ! own hook sees the state as it was BEFORE the composable finished updating it — and nothing
  // ! about the call site looks wrong.
  it('waits for a slow internal hook before starting the caller', async () => {
    const order: string[] = [];

    await chainAfter(
      async () => {
        await tick();
        order.push('internal');
      },
      () => order.push('caller')
    )();

    expect(order).toEqual(['internal', 'caller']);
  });

  it('resolves only once the caller hook has finished too', async () => {
    let callerFinished = false;

    await chainAfter(
      () => undefined,
      async () => {
        await tick();
        callerFinished = true;
      }
    )();

    expect(callerFinished).toBe(true);
  });

  it('hands both hooks every argument it was called with', async () => {
    const seen: unknown[][] = [];

    await chainAfter(
      (...args: [string, number]) => seen.push(args),
      (...args: [string, number]) => seen.push(args)
    )('data', 7);

    expect(seen).toEqual([
      ['data', 7],
      ['data', 7]
    ]);
  });

  // * The common case: most callers pass no hook of their own, and the composable still has to run.
  it('runs the internal hook when the caller supplied none', async () => {
    const order: string[] = [];

    await chainAfter(() => order.push('internal'), undefined)();

    expect(order).toEqual(['internal']);
  });

  // * An internal hook that only needs `data` says so, and still receives the rest silently.
  it('lets the internal hook declare fewer arguments than the caller', async () => {
    let seenData: unknown;

    await chainAfter(
      (data: string) => {
        seenData = data;
      },
      (_data: string, _vars: number, _context: object) => undefined
    )('data', 7, {});

    expect(seenData).toBe('data');
  });
});
