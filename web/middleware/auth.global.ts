import { determineAuthRedirect } from '@/utils/authRedirectLogic';

export default defineNuxtRouteMiddleware((to) => {
  const decision = determineAuthRedirect(to.path, to.query);

  if (decision.shouldRedirect && decision.redirectTo) {
    return navigateTo(decision.redirectTo, { replace: true });
  }
});
