export type RedirectDecision = {
  shouldRedirect: boolean;
  redirectTo?: string;
  reason?: string;
};

// * The whole redirect policy, and genuinely pure: the session state arrives as an argument rather than out of the store, so the signature states everything the answer depends on and the callers — middleware and the login-state watcher — stay the only places that touch the framework (`catalyst/stacks/frontend/nuxt/routing.md`).
export function determineAuthRedirect(
  path: string,
  isLoggedIn: boolean
): RedirectDecision {
  const pathWithoutQuery = path.split('?')[0] ?? path;

  if (pathWithoutQuery === '/') {
    return {
      shouldRedirect: true,
      redirectTo: '/home',
      reason: 'root_page_alias'
    };
  }

  const guestOnlyPages: string[] = ['/password-reset'];
  const sharedPages = ['/home'];
  const isGuestOnlyPage = guestOnlyPages.includes(pathWithoutQuery);
  const isProtectedPage =
    !isGuestOnlyPage && !sharedPages.includes(pathWithoutQuery);

  // * Redirect unauthenticated users away from protected pages
  if (!isLoggedIn && isProtectedPage) {
    return {
      shouldRedirect: true,
      redirectTo: '/home',
      reason: 'protected_page_without_auth'
    };
  }

  // * Redirect authenticated users away from guest-only pages
  if (isLoggedIn && isGuestOnlyPage) {
    return {
      shouldRedirect: true,
      redirectTo: '/home',
      reason: 'guest_only_page_with_auth'
    };
  }

  return { shouldRedirect: false };
}
