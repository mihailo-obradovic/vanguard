import type { FetchError } from 'ofetch';

export interface HandleApiErrorContext {
  routePath: string;
  resetUser: () => void;
}

export interface ErrorHandlingOptions {
  hideToast?: boolean;
  // Suppresses 422 toasts for forms that display validation errors inline;
  // other errors still toast.
  hideValidationToast?: boolean;
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
      resetUser();

      if (routePath !== '/login') {
        navigateTo('/login');
      }

      break;
    case 403:
      if (routePath !== '/home') {
        navigateTo('/home');
      }

      break;
    default:
      break;
  }

  if (options?.hideToast) {
    return;
  }

  // Validation failures list every field's message instead of Laravel's
  // "(and N more errors)" summary.
  const validationMessages =
    error.statusCode === 422 ? getValidationMessages(error) : [];

  if (validationMessages.length > 0) {
    if (!options?.hideValidationToast) {
      validationMessages.forEach((message) => $toast(message, 'error'));
    }
  } else {
    $toast(getErrorMessage(error), 'error');
  }
}
