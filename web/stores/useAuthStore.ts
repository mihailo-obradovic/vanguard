import { defineStore } from 'pinia';

import type { User } from '@/types/auth';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);

  // TODO: Move to in-memory?
  const accessToken = useCookie('accessToken');

  // TODO: Add refresh token?

  // TODO: Define and use refresh token?
  const isLoggedIn = computed(() => !!accessToken.value);

  function setUser(u: User) {
    user.value = u;
  }

  function resetUser() {
    user.value = null;
    accessToken.value = null;
  }

  return {
    user: readonly(user),
    accessToken,
    isLoggedIn,
    setUser,
    resetUser
  };
});
