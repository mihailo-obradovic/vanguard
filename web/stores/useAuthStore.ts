import { defineStore } from 'pinia';

import type { User } from '@/types/auth';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);

  const isLoggedIn = computed(() => !!user.value);

  function setUser(u: User) {
    user.value = u;
  }

  function updateUserInStore(u: User) {
    user.value = u;
  }

  function resetUser() {
    user.value = null;
  }

  return {
    user: readonly(user),
    isLoggedIn,
    setUser,
    updateUserInStore,
    resetUser
  };
});
