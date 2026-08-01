import type { Ref } from 'vue';
import type { FetchError } from 'ofetch';

// Derives field-keyed validation errors from a mutation's error ref, ready to
// pass to a form component's `server-errors` prop.
export function useValidationErrors(
  error: Readonly<Ref<FetchError | null | undefined>>
) {
  return computed(() => (error.value ? getValidationErrors(error.value) : {}));
}
