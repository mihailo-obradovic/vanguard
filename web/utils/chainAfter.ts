// * Any hook a caller may hand a query composable — the shape `chainAfter` reads its arguments from.
type Hook = (...args: never[]) => unknown;

// * Runs a composable's own hook, then the caller's — rule 2 of the options passthrough (`catalyst/stacks/frontend/nuxt/data-layer.md`), so a page redirecting on success finds the store already populated and a page reading a list finds it already invalidated.
// ! Both halves are awaited: firing the caller's hook without awaiting the internal one is the bug this exists to make unwriteable, and it stays invisible until the caller reads state the composable had not finished updating.
// ! The argument list comes from the caller's hook, never the internal one — an internal hook reading only `data` would otherwise fix the signature at one argument and the caller's three would no longer fit.
// ! `caller: TCaller | undefined` rather than `TCaller extends … | undefined`: inferring from an absent hook gives `Parameters<never>`, and the composed hook then accepts no arguments at all.
export function chainAfter<TCaller extends Hook = Hook>(
  internal: (...args: Parameters<TCaller>) => unknown,
  caller: TCaller | undefined
) {
  return async (...args: Parameters<TCaller>) => {
    await internal(...args);

    await caller?.(...args);
  };
}
