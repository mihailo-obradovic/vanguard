export default defineNuxtRouteMiddleware((_to, _from) => {
  const { isLoggedIn } = storeToRefs(useAuthStore());

  if (!isLoggedIn) {
    return navigateTo('/login', { replace: true });
  }
});
