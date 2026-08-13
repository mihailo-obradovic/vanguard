import { server } from './server';

export type RecordedRequest = {
  method: string;
  path: string;
  /** Header names are lower-cased, so assertions do not depend on how a caller spelled them. */
  headers: Record<string, string>;
  body: unknown;
};

export type RequestRecorder = {
  /** `['POST /login', 'GET /sanctum/csrf-cookie']` — the calls in the order they left the app. */
  trace: () => string[];
  count: () => number;
  at: (index: number) => Promise<RecordedRequest>;
  /** Wait until a full macrotask turn passes with no new request — see the implementation. */
  settle: () => Promise<void>;
  reset: () => void;
};

/**
 * Record every request the app sends, so a spec can assert what actually crossed the wire.
 *
 * Call once at spec scope and `reset()` between tests.
 */
export function recordRequests(): RequestRecorder {
  const captured: Request[] = [];

  // * Cloned synchronously as the request starts: the clone owns an unread body, so reading it
  // * later in an assertion cannot race the request the app is still making.
  server.events.on('request:start', ({ request }) => {
    captured.push(request.clone());
  });

  async function toRecord(request: Request): Promise<RecordedRequest> {
    // * Cloned again per read so `at()` stays idempotent — a body can only be consumed once,
    // * and a spec may inspect the same request from more than one assertion.
    const text = await request.clone().text();

    return {
      method: request.method,
      path: new URL(request.url).pathname,
      headers: Object.fromEntries(
        [...request.headers].map(([name, value]) => [name.toLowerCase(), value])
      ),
      body: text === '' ? undefined : JSON.parse(text)
    };
  }

  return {
    trace: () =>
      captured.map(
        (request) => `${request.method} ${new URL(request.url).pathname}`
      ),
    count: () => captured.length,
    at: async (index) => {
      const request = captured[index];

      if (!request) {
        throw new Error(
          `No request recorded at index ${index}; the app sent ${captured.length}.`
        );
      }

      return toRecord(request);
    },
    // ! `flushPromises()` alone drains microtasks, which is enough on an idle machine but lands
    // ! mid-refetch when the box is loaded — the refetch a cache invalidation triggers crosses a
    // ! timer, not only a promise chain. Waiting for the recorder to go quiet instead of for a
    // ! fixed number of ticks also strengthens the negative assertions: a request that should
    // ! never have been sent has had its chance to arrive before the trace is read.
    settle: async () => {
      let previous = -1;

      while (captured.length !== previous) {
        previous = captured.length;

        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    },
    reset: () => {
      captured.length = 0;
    }
  };
}
