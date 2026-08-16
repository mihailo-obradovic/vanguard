import { determineAuthRedirect } from '@/utils/authRedirectLogic';

export default defineNuxtRouteMiddleware((to) => {
  const { isLoggedIn } = storeToRefs(useAuthStore());

  const decision = determineAuthRedirect(to.path, isLoggedIn.value);

  if (decision.shouldRedirect && decision.redirectTo) {
    return navigateTo(decision.redirectTo, { replace: true });
  }
});
