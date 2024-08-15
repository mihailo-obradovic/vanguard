import { defineStore } from 'pinia';

import type { User } from '@/types/auth';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);

  const accessToken = useCookie('accessToken');

  const isLoggedIn = computed(() => !!accessToken.value);

  return { user, accessToken, isLoggedIn };
});
