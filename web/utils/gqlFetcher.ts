import { FetchError } from 'ofetch';

export type GqlVariables = Record<string, unknown>;

type GqlError = {
  message?: unknown;
  extensions?: {
    status?: unknown;
    validation?: unknown;
  };
};

type GqlResponse = {
  data?: unknown;
  errors?: GqlError[];
};

const GRAPHQL_PATH = '/graphql';

// * Lighthouse keys validation messages by argument name, which is also the form field name.
function toValidationBody(validation: unknown): Record<string, string[]> {
  if (!validation || typeof validation !== 'object') {
    return {};
  }

  return Object.fromEntries(
    Object.entries(validation).flatMap(([field, messages]) => {
      const fieldMessages = (Array.isArray(messages) ? messages : []).filter(
        (message): message is string => typeof message === 'string'
      );

      return fieldMessages.length > 0 ? [[field, fieldMessages]] : [];
    })
  );
}

// * Rebuilds a GraphQL error as the FetchError the REST path would have thrown. The server states the equivalence in `extensions.status` (see App\GraphQL\ErrorHandlers\RestStatusHandler), so nothing here has to match on message text.
// * A real FetchError matters beyond typing: `setupQueryErrorHandling` dedupes on object identity in a WeakSet, and Pinia Colada is configured with FetchError as its error type project-wide.
function toFetchError(errors: GqlError[]): FetchError {
  const first = errors[0] ?? {};

  const message =
    typeof first.message === 'string' && first.message.trim() !== ''
      ? first.message
      : 'GraphQL request failed.';

  const statusCode =
    typeof first.extensions?.status === 'number'
      ? first.extensions.status
      : 500;

  const validationErrors = toValidationBody(first.extensions?.validation);

  const error = new FetchError(message);

  error.statusCode = statusCode;
  error.status = statusCode;
  // * handleApiError reads `errors` for 422s and falls back to `message` for everything else, exactly as it does for a Laravel JSON body.
  error.data =
    Object.keys(validationErrors).length > 0
      ? { message, errors: validationErrors }
      : { message };

  return error;
}

// * Sends a GraphQL operation and returns its `data` payload. Rides the project's own `fetcher`, so credentialed cookies, the CSRF header, and the one-shot 419 refresh-and-retry all apply unchanged — the GraphQL layer adds a body format and an error translation, nothing more.
// * GraphQL reports failures as HTTP 200 with an `errors` array, so any `errors` entry is thrown and partial data never reaches a call site; transport-level failures (500, network) surface as the ordinary FetchError `fetcher` already throws.
// * Returns `unknown` on purpose: services must run the result through `parseResponse`, the same rule `fetcher` enforces for REST.
export async function gqlFetcher(
  document: string,
  variables?: GqlVariables
): Promise<unknown> {
  const response = await fetcher<GqlResponse>(GRAPHQL_PATH, {
    method: 'POST',
    body: { query: document, variables: variables ?? {} }
  });

  if (response.errors && response.errors.length > 0) {
    throw toFetchError(response.errors);
  }

  return response.data;
}
