import type { FetchError } from 'ofetch';

import '@pinia/colada';

declare module '@pinia/colada' {
  interface TypesConfig {
    // * A slight lie: parseResponse throws a plain Error, which also lands here. Its statusCode is undefined, so handleApiError falls through to the generic-toast branch — which is the intended handling.
    defaultError: FetchError;
  }
}

export {};
