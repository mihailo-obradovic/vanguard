import { defineStore } from 'pinia';

export const useLoadingStore = defineStore('loading', () => {
  const isLoading = ref<Record<string, boolean>>({});

  function $startLoading(keys: string | Array<string>) {
    if (Array.isArray(keys)) {
      keys.forEach((key) => {
        isLoading.value[key] = true;
      });

      return;
    }

    isLoading.value[keys] = true;
  }

  function $stopLoading(key: string) {
    isLoading.value[key] = false;
  }

  function clearLoadingStates() {
    isLoading.value = {};
  }

  return { isLoading, $startLoading, $stopLoading, clearLoadingStates };
});
