import { beforeAll, afterEach, afterAll } from 'vitest';
import { createFetch } from 'ofetch';

import { server } from './server';

// ! Must run at module scope, not in a hook. The Nuxt test environment builds `$fetch` over its
// ! own in-memory h3 app, and `#build/fetch.mjs` — what app code's auto-imported `$fetch`
// ! resolves to — captures `globalThis.$fetch` when it is first imported. Setup files are
// ! evaluated before the spec's import graph, so replacing it here is what app code picks up;
// ! assigning in `beforeAll` would land after the binding was already taken.
//
// ! The replacement calls `globalThis.fetch` late, so it reaches whatever MSW has patched in.
// ! This takes the h3 app out of the path, which is why `registerEndpoint` no longer works.
// ! Headers are flattened to a plain record on the way out. The DOM environment's `Headers`
// ! class and Node's `fetch` come from different realms, and the foreign instance is dropped
// ! silently rather than rejected — which would quietly erase `Accept` and `X-XSRF-TOKEN` from
// ! every recorded request.
function toPlainHeaders(headers: HeadersInit): Record<string, string> {
  return Object.fromEntries(new Headers(headers));
}

globalThis.$fetch = createFetch({
  fetch: (input: RequestInfo | URL, init?: RequestInit) =>
    globalThis.fetch(
      input,
      init?.headers ? { ...init, headers: toPlainHeaders(init.headers) } : init
    ),
  Headers: globalThis.Headers
}) as typeof globalThis.$fetch;

beforeAll(() => {
  // ! `error` on unhandled requests is deliberate: a request the handlers do not describe is a
  // ! test lying about what it exercises, so it fails loudly instead of reaching the network.
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
