import { defineStore } from 'pinia';

export const useLoadingStore = defineStore('loading', () => {
  const isLoading = ref<Record<string, boolean>>({});

  function $startLoading(key: string) {
    isLoading.value[key] = true;
  }

  function $stopLoading(key: string) {
    isLoading.value[key] = false;
  }

  function clearLoadingStates() {
    isLoading.value = {};
  }

  return { isLoading, $startLoading, $stopLoading, clearLoadingStates };
});
