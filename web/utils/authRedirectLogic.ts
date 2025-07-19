export interface RedirectDecision {
  shouldRedirect: boolean;
  redirectTo?: string;
  reason?: string;
}

export function determineAuthRedirect(
  path: string,
  _query: Record<string, any> // * For compatibility with more complex logic
): RedirectDecision {
  const { isLoggedIn } = storeToRefs(useAuthStore());

  const pathWithoutQuery = path.split('?')[0];

  const guestOnlyPages = ['/login', '/register'];
  const isGuestOnlyPage = guestOnlyPages.includes(pathWithoutQuery);
  const isProtectedPage =
    !guestOnlyPages.includes(pathWithoutQuery) && pathWithoutQuery !== '/';

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
