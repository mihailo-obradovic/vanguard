import type { FetchError } from 'ofetch';

export interface HandleApiErrorContext {
  routePath: string;
  resetUser: () => void;
}

export interface ErrorHandlingOptions {
  // * 'validation' silences 422s for forms that render them inline, leaving every other status to toast; 'all' silences the call entirely and hands the failure to the caller.
  suppressToasts?: 'all' | 'validation';
}

function getValidationMessages(error: FetchError): string[] {
  return Object.values(getValidationErrors(error)).flat();
}

export function handleApiError(
  error: FetchError,
  context: HandleApiErrorContext,
  options?: ErrorHandlingOptions
) {
  const { routePath, resetUser } = context;

  switch (error.statusCode) {
    case 401:
      // * Only clears the user — the isLoggedIn watcher in app.vue redirects via the branch's own authRedirectLogic.
      resetUser();

      break;
    case 403:
      if (routePath !== '/home') {
        navigateTo('/home');
      }

      break;
    default:
      break;
  }

  // * Validation failures list every field's message instead of Laravel's "(and N more errors)" summary.
  const validationMessages =
    error.statusCode === 422 ? getValidationMessages(error) : [];

  if (validationMessages.length > 0) {
    // * Either value covers a validation toast; only 'all' reaches the generic one below.
    if (!options?.suppressToasts) {
      validationMessages.forEach((message) => $toast(message, 'error'));
    }
  } else if (options?.suppressToasts !== 'all') {
    $toast(getErrorMessage(error), 'error');
  }
}
