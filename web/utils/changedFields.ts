// * Builds a partial-update payload: the entries of `next` whose values differ from
// * `current` (shallow strict equality). Both update endpoints treat an omitted key as
// * "keep the current value", so sending only the diff narrows the window in which two
// * concurrent editors silently overwrite each other's fields with stale snapshots.
// ! One caller, and deliberately not shared with the password-key omission in `pages/users.vue` and `components/users/UserCard.vue`. A design review proposed folding all three into one payload builder; they share the shape of the outcome, not a rule. This one answers "what did the user actually change"; those two answer "which password keys are legitimate to send at all" — a present-but-empty `current_password` is rejected by the backend, so a rename must omit the keys entirely rather than diff them away. Unifying them would need a builder parameterized over both questions, which is a wider interface than the lines it would absorb. `UserCard.spec.ts` asserts its `PUT /api/profile` body directly, so that rule is covered where it runs.
export function changedFields<T extends Record<string, unknown>>(
  current: Record<string, unknown>,
  next: T
): Partial<T> {
  return Object.fromEntries(
    Object.entries(next).filter(([key, value]) => value !== current[key])
  ) as Partial<T>;
}
