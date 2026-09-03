import type { FetchError } from 'ofetch';

// ! Reads as half-parameterized — `navigateTo` and `$toast` are called ambiently while these two are injected — and a design review proposed either passing all four or dropping the object entirely. Kept: the split is what varies, not what has an effect. `routePath` differs per call, and `resetUser` needs a store instance this module must not reach for; `navigateTo` and `$toast` are app-wide globals that are the same at every call site. Widening the context would make three call sites restate what cannot differ. Round 1 of the design review recorded this module and its adapter as the codebase's reference depth shape; that stands.
export interface HandleApiErrorContext {
  routePath: string;
  resetUser: () => void;
}

export interface ErrorHandlingOptions {
  // * 'validation' silences 422s for forms that render them inline, leaving every other status to toast; 'all' silences the call entirely and hands the failure to the caller.
  suppressToasts?: 'all' | 'validation';
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

function getValidationMessages(error: FetchError): string[] {
  return Object.values(getValidationErrors(error)).flat();
}
