import useUserService from '@/services/useUserService';

export default defineNuxtPlugin(async (_nuxtApp) => {
  const { isLoggedIn } = storeToRefs(useAuthStore());

  const { fetchCurrentUser } = useUserService();

  if (isLoggedIn.value) {
    await fetchCurrentUser();
  }
});
