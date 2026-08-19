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
  if (!isLoggedIn.value && isProtectedPage) {
    return {
      shouldRedirect: true,
      redirectTo: '/home',
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
