// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { FetchError } from 'ofetch';
import { defineComponent, nextTick, ref, shallowRef } from 'vue';

import { setupQueryErrorHandling } from '../setupQueryErrorHandling';

import type { Ref } from 'vue';
import type { ErrorHandlingOptions } from '../handleApiError';

// * The unit under test is the watcher and its dedupe, so the handler it delegates to is the observable boundary; what the handler then does is handleApiError.spec's subject.
const { handleApiError, resetUser } = vi.hoisted(() => ({
  handleApiError: vi.fn<(...args: unknown[]) => void>(),
  resetUser: vi.fn<() => void>()
}));

mockNuxtImport('handleApiError', () => handleApiError);
mockNuxtImport('useAuthStore', () => () => ({ resetUser }));

const routePath = ref('/users');

mockNuxtImport('useRoute', () => () => ({
  get path() {
    return routePath.value;
  }
}));

function apiError(statusCode = 500) {
  const error = new FetchError('Request failed');

  error.statusCode = statusCode;

  return error;
}

// * Mounted rather than called bare: the watcher belongs to a component scope, which is the only way `useAppQuery` ever wires it.
function watchErrors(
  errorRef: Ref<FetchError | null>,
  errorHandling?: ErrorHandlingOptions
) {
  return mount(
    defineComponent({
      setup() {
        setupQueryErrorHandling(errorRef, errorHandling);

        return () => null;
      }
    })
  );
}

describe('setupQueryErrorHandling', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    handleApiError.mockClear();
    routePath.value = '/users';
  });

  it('handles a failure once it appears on the query', async () => {
    const error = shallowRef<FetchError | null>(null);

    watchErrors(error);

    error.value = apiError(403);
    await nextTick();

    expect(handleApiError).toHaveBeenCalledOnce();
    expect(handleApiError.mock.calls[0]?.[0]).toBe(error.value);
  });

  it('gives the handler the current route and the store reset', async () => {
    const error = shallowRef<FetchError | null>(null);

    routePath.value = '/profile';
    watchErrors(error);

    error.value = apiError();
    await nextTick();

    expect(handleApiError.mock.calls[0]?.[1]).toEqual({
      routePath: '/profile',
      resetUser
    });
  });

  it('forwards the caller error-handling options', async () => {
    const error = shallowRef<FetchError | null>(null);

    watchErrors(error, { hideValidationToast: true });

    error.value = apiError(422);
    await nextTick();

    expect(handleApiError.mock.calls[0]?.[2]).toEqual({
      hideValidationToast: true
    });
  });

  it('ignores the query clearing its error', async () => {
    const error = shallowRef<FetchError | null>(apiError());

    watchErrors(error);

    error.value = null;
    await nextTick();

    expect(handleApiError).not.toHaveBeenCalled();
  });

  it('handles one failure once even when several components watch the same query', async () => {
    const error = shallowRef<FetchError | null>(null);

    watchErrors(error);
    watchErrors(error);
    watchErrors(error);

    error.value = apiError(401);
    await nextTick();

    // * Three watchers, one toast — a shared query must not shout three times.
    expect(handleApiError).toHaveBeenCalledOnce();
  });

  it('handles the next failure of an already-failed query', async () => {
    const error = shallowRef<FetchError | null>(null);

    watchErrors(error);

    error.value = apiError(500);
    await nextTick();

    error.value = apiError(500);
    await nextTick();

    // * Deduped per error object, not per query: a retry that fails again is news.
    expect(handleApiError).toHaveBeenCalledTimes(2);
  });
});
