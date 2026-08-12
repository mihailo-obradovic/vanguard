export default defineNuxtPlugin({
  async setup() {
    const { setUser, resetUser } = useAuthStore();

    // * Prime the CSRF cookie for the SPA session.
    await fetcher('/sanctum/csrf-cookie');

    // * Rehydrate the authenticated user from the session cookie, if present.
    try {
      setUser(await fetchCurrentUser());
    } catch {
      resetUser();
    }
  }
});
