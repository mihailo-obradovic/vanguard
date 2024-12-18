import { defineStore } from 'pinia';

import type { User } from '@/types/types';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);

  // TODO: Move to in-memory?
  const accessToken = useCookie('accessToken');

  // TODO: Add refresh token?

  // TODO: Define and use refresh token?
  const isLoggedIn = computed(() => !!user.value);

  return { user, accessToken, isLoggedIn };
});
