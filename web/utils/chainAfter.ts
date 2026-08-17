/** Any hook a caller may hand a query composable — the shape `chainAfter` reads its arguments from. */
type Hook = (...args: never[]) => unknown;

/**
 * Compose a composable's own hook with the caller's, in that order.
 *
 * * Rule 2 of the options passthrough (`catalyst/stacks/frontend/nuxt/data-layer.md`): the caller's
 * * hook runs *after* the internal work, so a page redirecting on success finds the store already
 * * populated and a page reading a list finds it already invalidated.
 *
 * ! Both halves are awaited. Firing the caller's hook without awaiting the internal one is the bug
 * ! this exists to make unwriteable — it is invisible until the caller reads state the composable
 * ! had not finished updating.
 *
 * ! The argument list comes from the CALLER's hook (`Parameters<TCaller>`), never from
 * ! the internal one: an internal hook reading only `data` would otherwise fix the signature at one
 * ! argument and the caller's three would no longer fit. Declaring the internal hook with fewer
 * ! parameters than the caller's is the point — it takes what it needs and ignores the rest.
 */
// ! `caller: TCaller | undefined` rather than `TCaller extends … | undefined`: an absent hook must
// ! not be what defines the argument list. Inferring from `undefined` gives `Parameters<never>`, and
// ! the composed hook then accepts no arguments at all.
export function chainAfter<TCaller extends Hook = Hook>(
  internal: (...args: Parameters<TCaller>) => unknown,
  caller: TCaller | undefined
) {
  return async (...args: Parameters<TCaller>) => {
    await internal(...args);

    await caller?.(...args);
  };
}
