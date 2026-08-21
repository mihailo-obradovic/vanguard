// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { FetchError } from 'ofetch';

import { handleApiError } from '../handleApiError';

// * Only the two side effects are replaced. `getErrorMessage` and `getValidationErrors` stay real so these cases assert the message a user would actually see, not a stub of it.
const { $toast, navigateTo } = vi.hoisted(() => ({
  $toast: vi.fn<(...args: unknown[]) => void>(),
  navigateTo: vi.fn<(...args: unknown[]) => void>()
}));

mockNuxtImport('$toast', () => $toast);
mockNuxtImport('navigateTo', () => navigateTo);

function apiError(statusCode: number, data: Record<string, unknown> = {}) {
  const error = new FetchError('Request failed');

  error.statusCode = statusCode;
  error.data = data;

  return error;
}

const resetUser = vi.fn<() => void>();

function context(routePath = '/users') {
  return { routePath, resetUser };
}

function toastedMessages() {
  return $toast.mock.calls.map(([message]) => message);
}

function toastedSeverities() {
  return $toast.mock.calls.map(([, severity]) => severity);
}

describe('handleApiError', () => {
  beforeEach(() => {
    $toast.mockClear();
    navigateTo.mockClear();
    resetUser.mockClear();
  });

  it('clears the user on 401 but leaves the redirect to the auth watcher', () => {
    handleApiError(apiError(401, { message: 'Unauthenticated.' }), context());

    expect(resetUser).toHaveBeenCalledOnce();
    expect(navigateTo).not.toHaveBeenCalled();
    expect(toastedMessages()).toEqual(['Unauthenticated.']);
  });

  it('sends a forbidden user home', () => {
    handleApiError(
      apiError(403, { message: 'This action is unauthorized.' }),
      context()
    );

    expect(navigateTo).toHaveBeenCalledWith('/home');
    expect(resetUser).not.toHaveBeenCalled();
  });

  it('does not navigate when the forbidden request came from home already', () => {
    handleApiError(apiError(403), context('/home'));

    expect(navigateTo).not.toHaveBeenCalled();
  });

  it('lists every field message on a validation failure', () => {
    handleApiError(
      apiError(422, {
        message: 'The given data was invalid.',
        errors: {
          email: ['The email has already been taken.'],
          password: [
            'The password must be at least 8 characters.',
            'The password confirmation does not match.'
          ]
        }
      }),
      context()
    );

    // * Laravel's own message would summarise these as "(and 2 more errors)".
    expect(toastedMessages()).toEqual([
      'The email has already been taken.',
      'The password must be at least 8 characters.',
      'The password confirmation does not match.'
    ]);
  });

  it('stays silent on a validation failure a form renders inline', () => {
    handleApiError(
      apiError(422, {
        errors: { email: ['The email has already been taken.'] }
      }),
      context(),
      { hideValidationToast: true }
    );

    expect($toast).not.toHaveBeenCalled();
  });

  it('still toasts a non-validation failure for a form that suppresses 422s', () => {
    handleApiError(apiError(500, { message: 'Server error' }), context(), {
      hideValidationToast: true
    });

    expect(toastedMessages()).toEqual(['Server error']);
  });

  it('falls back to the generic message when a 422 carries no field errors', () => {
    handleApiError(
      apiError(422, { message: 'The given data was invalid.' }),
      context(),
      { hideValidationToast: true }
    );

    // * Suppression covers field messages only — a 422 with nothing to render inline would otherwise fail silently.
    expect(toastedMessages()).toEqual(['The given data was invalid.']);
  });

  it('ignores field errors on a status other than 422', () => {
    // * Only a 422 states a validation failure; an `errors` bag on anything else is not one, and listing it would bury the message that actually explains the failure.
    handleApiError(
      apiError(500, {
        message: 'Server error',
        errors: { email: ['The email has already been taken.'] }
      }),
      context()
    );

    expect(toastedMessages()).toEqual(['Server error']);
  });

  it('raises field messages at error severity', () => {
    handleApiError(
      apiError(422, {
        errors: { email: ['The email has already been taken.'] }
      }),
      context()
    );

    expect(toastedSeverities()).toEqual(['error']);
  });

  it('raises the fallback message at error severity', () => {
    handleApiError(apiError(500, { message: 'Server error' }), context());

    expect(toastedSeverities()).toEqual(['error']);
  });

  it('toasts anything else without touching the session or the route', () => {
    handleApiError(apiError(500, { message: 'Server error' }), context());

    expect(toastedMessages()).toEqual(['Server error']);
    expect(resetUser).not.toHaveBeenCalled();
    expect(navigateTo).not.toHaveBeenCalled();
  });
});
