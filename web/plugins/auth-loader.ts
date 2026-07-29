export default defineNuxtPlugin({
  async setup() {
    const { resetUser } = useAuthStore();

    // Prime the CSRF cookie for the SPA session.
    await fetcher('/sanctum/csrf-cookie');

    // Rehydrate the authenticated user from the session cookie, if present.
    try {
      await fetchCurrentUser();
    } catch {
      resetUser();
    }
  }
});
