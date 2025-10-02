export default defineNuxtRouteMiddleware(() => {
  const { clearLoadingStates } = useLoadingStore();

  clearLoadingStates();
});
