import type { User } from '@/types/auth';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);

  const isLoggedIn = computed(() => !!user.value);

  const isAdmin = computed(() => user.value?.role === 'admin');

  function setUser(u: User) {
    user.value = u;
  }

  function resetUser() {
    user.value = null;
  }

  return {
    user: readonly(user),
    isLoggedIn,
    isAdmin,
    setUser,
    resetUser
  };
});
