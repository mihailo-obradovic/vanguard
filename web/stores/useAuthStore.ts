import { defineStore } from 'pinia';

import type { User } from '@/types/types';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);

  const isLoggedIn = computed(() => !!user.value);

  return { user, isLoggedIn };
});
