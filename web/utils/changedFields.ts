// * Builds a partial-update payload: the entries of `next` whose values differ from `current` (shallow strict equality). Both update endpoints treat an omitted key as "keep the current value", so sending only the diff narrows the window in which two concurrent editors silently overwrite each other's fields with stale snapshots.
export function changedFields<T extends Record<string, unknown>>(
  current: Record<string, unknown>,
  next: T
): Partial<T> {
  return Object.fromEntries(
    Object.entries(next).filter(([key, value]) => value !== current[key])
  ) as Partial<T>;
}
