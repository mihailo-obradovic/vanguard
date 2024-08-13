export default defineNuxtRouteMiddleware((_to, _from) => {
  const auth = useAuthStore();

  if (!auth.isLoggedIn) {
    return navigateTo('/', { replace: true });
  }
});
