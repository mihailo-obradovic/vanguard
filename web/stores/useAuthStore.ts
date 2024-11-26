import { defineStore } from 'pinia';

import type { User } from '@/types/auth';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);

  // TODO: Move to in-memory?
  const accessToken = useCookie('accessToken');

  // TODO: Define and use refresh token?
  const isLoggedIn = computed(() => !!accessToken.value);

  return { user, accessToken, isLoggedIn };
});
