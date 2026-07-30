import type { FetchError } from 'ofetch';

import '@pinia/colada';

declare module '@pinia/colada' {
  interface TypesConfig {
    defaultError: FetchError;
  }
}

export {};
