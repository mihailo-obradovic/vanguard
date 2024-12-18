export default defineNuxtRouteMiddleware((_to, _from) => {
  const { isLoggedIn } = storeToRefs(useAuthStore());

  if (isLoggedIn.value) {
    return navigateTo('/', { replace: true });
  }
});
