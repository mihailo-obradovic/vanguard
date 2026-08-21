// @vitest-environment nuxt
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { FetchError } from 'ofetch';

import { server } from '@/mocks/server';
import { apiUrl } from '@/mocks/api';
import { recordRequests } from '@/mocks/requests';
import { graphqlHandler, GRAPHQL_PATH } from '@/mocks/graphql';

import { gqlFetcher } from '../gqlFetcher';

const requests = recordRequests();

// * Mirrors the envelopes asserted in tests/Feature/GraphQL — the client contract is only honest if these shapes stay the ones the server actually sends.
function graphqlError(
  message: string,
  extensions: Record<string, unknown> = {}
) {
  return { data: null, errors: [{ message, extensions }] };
}

async function expectRejection(promise: Promise<unknown>) {
  return promise.then(
    () => {
      throw new Error('Expected the request to reject.');
    },
    (error: unknown) => error as FetchError
  );
}

describe('gqlFetcher', () => {
  beforeEach(() => {
    requests.reset();
  });

  it('posts the document and variables, and returns the data payload', async () => {
    server.use(graphqlHandler({ data: { users: [{ id: 1 }] } }));

    const data = await gqlFetcher('query Users { users { id } }', { page: 2 });

    expect(data).toEqual({ users: [{ id: 1 }] });

    const request = await requests.at(0);

    expect(request.method).toBe('POST');
    expect(request.path).toBe(GRAPHQL_PATH);
    expect(request.body).toEqual({
      query: 'query Users { users { id } }',
      variables: { page: 2 }
    });
  });

  it('sends an empty variables object when none are given', async () => {
    server.use(graphqlHandler({ data: {} }));

    await gqlFetcher('{ users { id } }');

    expect((await requests.at(0)).body).toEqual({
      query: '{ users { id } }',
      variables: {}
    });
  });

  it('returns the data payload when the errors array is present but empty', async () => {
    server.use(graphqlHandler({ data: { users: [] }, errors: [] }));

    const data = await gqlFetcher('{ users { id } }');

    expect(data).toEqual({ users: [] });
  });

  it('falls back to a generic message when the error message is blank', async () => {
    server.use(graphqlHandler(graphqlError('   ', { status: 500 })));

    const error = await expectRejection(gqlFetcher('{ users { id } }'));

    expect(error.data.message).toBe('GraphQL request failed.');
  });

  it('falls back to a generic message when the error carries no message', async () => {
    server.use(
      graphqlHandler({ data: null, errors: [{ extensions: { status: 500 } }] })
    );

    const error = await expectRejection(gqlFetcher('{ users { id } }'));

    expect(error.data.message).toBe('GraphQL request failed.');
  });

  it('defaults to 500 when the error carries no extensions at all', async () => {
    server.use(graphqlHandler({ data: null, errors: [{ message: 'Boom' }] }));

    const error = await expectRejection(gqlFetcher('{ users { id } }'));

    expect(error).toBeInstanceOf(FetchError);
    expect(error.statusCode).toBe(500);
  });

  it('ignores a validation payload that arrives as null', async () => {
    server.use(
      graphqlHandler(
        graphqlError('Validation failed.', { status: 422, validation: null })
      )
    );

    const error = await expectRejection(gqlFetcher('mutation {}'));

    expect(error.statusCode).toBe(422);
    expect(error.data.errors).toBeUndefined();
  });

  it('ignores a validation payload that is not an object', async () => {
    server.use(
      graphqlHandler(
        graphqlError('Validation failed.', { status: 422, validation: 'nope' })
      )
    );

    const error = await expectRejection(gqlFetcher('mutation {}'));

    expect(error.data.errors).toBeUndefined();
  });

  it('drops validation messages that are not string arrays', async () => {
    server.use(
      graphqlHandler(
        graphqlError('Validation failed.', {
          status: 422,
          validation: { email: ['Taken.', 7], name: 'not-an-array' }
        })
      )
    );

    const error = await expectRejection(gqlFetcher('mutation {}'));

    expect(error.data.errors).toEqual({ email: ['Taken.'] });
  });

  it('translates a validation error into a 422 with field-keyed messages', async () => {
    server.use(
      graphqlHandler(
        graphqlError('Validation failed for the field [updateUser].', {
          status: 422,
          validation: { email: ['The email has already been taken.'] }
        })
      )
    );

    const error = await expectRejection(gqlFetcher('mutation {}'));

    expect(error).toBeInstanceOf(FetchError);
    expect(error.statusCode).toBe(422);
    // * The shape getValidationErrors() reads, so 422s render inline on the field.
    expect(error.data.errors).toEqual({
      email: ['The email has already been taken.']
    });
  });

  it('translates an authentication error into a 401', async () => {
    server.use(
      graphqlHandler(
        graphqlError('Unauthenticated.', { status: 401, guards: ['sanctum'] })
      )
    );

    const error = await expectRejection(gqlFetcher('{ users { id } }'));

    expect(error.statusCode).toBe(401);
    expect(error.data.errors).toBeUndefined();
  });

  it('translates an authorization error into a 403', async () => {
    server.use(
      graphqlHandler(
        graphqlError('This action is unauthorized.', { status: 403 })
      )
    );

    const error = await expectRejection(gqlFetcher('{ users { id } }'));

    expect(error.statusCode).toBe(403);
  });

  it('falls back to 500 with the first message when no status is stated', async () => {
    server.use(graphqlHandler(graphqlError('Internal server error')));

    const error = await expectRejection(gqlFetcher('{ users { id } }'));

    expect(error.statusCode).toBe(500);
    // * getErrorMessage() prefers data.message, so this is what the toast shows.
    expect(error.data.message).toBe('Internal server error');
  });

  it('treats a partial result as a failure rather than returning half the data', async () => {
    server.use(
      graphqlHandler({
        data: { users: [{ id: 1 }] },
        errors: [{ message: 'Something failed', extensions: { status: 403 } }]
      })
    );

    const error = await expectRejection(gqlFetcher('{ users { id } }'));

    expect(error.statusCode).toBe(403);
  });

  it('lets an HTTP-level failure through without translating it', async () => {
    server.use(
      http.post(apiUrl(GRAPHQL_PATH), () =>
        HttpResponse.json({ message: 'Server exploded' }, { status: 500 })
      )
    );

    const error = await expectRejection(gqlFetcher('{ users { id } }'));

    expect(error).toBeInstanceOf(FetchError);
    // * The body the server sent, not a message rebuilt from an `errors` array.
    expect(error.data.message).toBe('Server exploded');
  });

  it('lets a transport failure through untouched', async () => {
    server.use(http.post(apiUrl(GRAPHQL_PATH), () => HttpResponse.error()));

    const error = await expectRejection(gqlFetcher('{ users { id } }'));

    expect(error).toBeInstanceOf(FetchError);
    // * Nothing answered, so there is no status to translate.
    expect(error.statusCode).toBeUndefined();
  });
});
