import useUserService from '@/services/useUserService';

export default defineNuxtPlugin(async (_nuxtApp) => {
  const { user, isLoggedIn } = storeToRefs(useAuthStore());

  const { fetchCurrentUser } = useUserService();

  if (isLoggedIn.value) {
    const response: any = await fetchCurrentUser();

    user.value = response;
  }
});
