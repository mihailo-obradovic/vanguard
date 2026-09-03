export type RedirectDecision = {
  shouldRedirect: boolean;
  redirectTo?: string;
  reason?: string;
};

// * The whole redirect policy, and genuinely pure: the session state arrives as an argument rather than out of the store, so the signature states everything the answer depends on and the callers — middleware and the login-state watcher — stay the only places that touch the framework (`catalyst/stacks/frontend/nuxt/routing.md`).
export type SessionState = 'guest' | 'signed-in';

export function determineAuthRedirect(
  path: string,
  session: SessionState
): RedirectDecision {
  const isLoggedIn = session === 'signed-in';
  const pathWithoutQuery = path.split('?')[0] ?? path;

  if (pathWithoutQuery === '/') {
    return {
      shouldRedirect: true,
      redirectTo: '/home',
      reason: 'root_page_alias'
    };
  }

  // * Login, register and password recovery are dialogs the layout opens, so the reset page is the only guest-only route left — it is reached from an emailed link rather than from inside the app.
  const guestOnlyPages = ['/password-reset'];
  const sharedPages = ['/home'];
  const isGuestOnlyPage = guestOnlyPages.includes(pathWithoutQuery);
  const isProtectedPage =
    !isGuestOnlyPage && !sharedPages.includes(pathWithoutQuery);

  // * Redirect unauthenticated users away from protected pages. Home, not login: there is no login route to send them to, and the layout's Login button is on every page.
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
