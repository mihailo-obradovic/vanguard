export default defineNuxtRouteMiddleware(() => {
  const { clearLoadingStates } = useLoadingStore();
  const { clearFormErrors } = useFormErrorsStore();

  clearLoadingStates();
  clearFormErrors();
});
