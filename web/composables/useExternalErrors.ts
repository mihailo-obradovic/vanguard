import type { WatchSource } from 'vue';

// * Mirrors incoming server errors into a ref that Regle can own as its `externalErrors` modifier. Regle clears entries as the user edits fields, so the source is copied rather than shared.
export function useExternalErrors(
  source: WatchSource<Record<string, string[]>>
) {
  const externalErrors = ref<Record<string, string[]>>({});

  watch(source, (errors) => {
    externalErrors.value = { ...errors };
  });

  return externalErrors;
}
