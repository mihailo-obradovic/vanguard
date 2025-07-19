import { defineStore } from 'pinia';

import type { User } from '@/types/auth';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);

  const accessToken = useCookie('accessToken', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax'
  });

  // TODO: Implement refresh token rotation for better security
  const isLoggedIn = computed(() => !!accessToken.value);

  function setUser(u: User) {
    user.value = u;
  }

  function setAccessToken(token: string) {
    accessToken.value = token;
  }

  function resetUser() {
    user.value = null;
    accessToken.value = null;
  }

  return {
    user: readonly(user),
    accessToken: readonly(accessToken),
    isLoggedIn,
    setUser,
    resetUser,
    setAccessToken
  };
});
