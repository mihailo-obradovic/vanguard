import type { LocationQuery } from 'vue-router';

export type RedirectDecision = {
  shouldRedirect: boolean;
  redirectTo?: string;
  reason?: string;
};

export function determineAuthRedirect(
  path: string,
  _query: LocationQuery // * For compatibility with more complex logic
): RedirectDecision {
  const { isLoggedIn } = storeToRefs(useAuthStore());

  const pathWithoutQuery = path.split('?')[0];

  if (pathWithoutQuery === '/') {
    return {
      shouldRedirect: true,
      redirectTo: '/home',
      reason: 'root_page_alias'
    };
  }

  const guestOnlyPages = ['/login', '/register', '/guest-only'];
  const sharedPages = ['/home'];
  const isGuestOnlyPage = guestOnlyPages.includes(pathWithoutQuery);
  const isProtectedPage =
    !guestOnlyPages.includes(pathWithoutQuery) &&
    !sharedPages.includes(pathWithoutQuery);

  // * Redirect unauthenticated users away from protected pages
  if (!isLoggedIn.value && isProtectedPage) {
    return {
      shouldRedirect: true,
      redirectTo: '/login',
      reason: 'protected_page_without_auth'
    };
  }

  // * Redirect authenticated users away from guest-only pages
  if (isLoggedIn.value && isGuestOnlyPage) {
    return {
      shouldRedirect: true,
      redirectTo: '/home',
      reason: 'guest_only_page_with_auth'
    };
  }

  return { shouldRedirect: false };
}
