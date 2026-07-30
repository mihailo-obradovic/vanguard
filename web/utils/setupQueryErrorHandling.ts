import type { Ref } from 'vue';
import type { FetchError } from 'ofetch';
import type { ErrorHandlingOptions } from '@/utils/handleApiError';

// A query shared by multiple components attaches one watcher per component
// instance, all observing the same error ref. Track handled error objects so
// a single failure is only ever handled (toasted/redirected) once.
const handledErrors = new WeakSet<FetchError>();

export function setupQueryErrorHandling(
  errorRef: Readonly<Ref<FetchError | null>>,
  errorHandling?: ErrorHandlingOptions
) {
  const route = useRoute();
  const { resetUser } = useAuthStore();

  watch(errorRef, (error) => {
    if (!error || handledErrors.has(error)) {
      return;
    }

    handledErrors.add(error);

    handleApiError(error, { routePath: route.path, resetUser }, errorHandling);
  });
}
