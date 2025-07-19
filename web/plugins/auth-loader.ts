export default defineNuxtPlugin({
  async setup() {
    const { isLoggedIn } = storeToRefs(useAuthStore());
    const { resetUser } = useAuthStore();

    if (isLoggedIn.value) {
      try {
        await fetchCurrentUser();
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'An error occurred';
        $toast(message, 'error');

        resetUser();
      }
    }
  }
});
