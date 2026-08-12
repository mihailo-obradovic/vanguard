// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { FetchError } from 'ofetch';

import { gqlFetcher } from '../gqlFetcher';

// * `fetcher` is auto-imported, so it is replaced through Nuxt's import mocking rather than
// * a module mock. `vi.hoisted` is required: mockNuxtImport is hoisted above the declaration.
const { fetcher } = vi.hoisted(() => ({
  fetcher: vi.fn<(...args: unknown[]) => Promise<unknown>>()
}));

mockNuxtImport('fetcher', () => fetcher);

// * Mirrors the envelopes asserted in tests/Feature/GraphQL — the client contract is only
// * honest if these shapes stay the ones the server actually sends.
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
    fetcher.mockReset();
  });

  it('posts the document and variables, and returns the data payload', async () => {
    fetcher.mockResolvedValue({ data: { users: [{ id: 1 }] } });

    const data = await gqlFetcher('query Users { users { id } }', { page: 2 });

    expect(data).toEqual({ users: [{ id: 1 }] });
    expect(fetcher).toHaveBeenCalledWith('/graphql', {
      method: 'POST',
      body: { query: 'query Users { users { id } }', variables: { page: 2 } }
    });
  });

  it('sends an empty variables object when none are given', async () => {
    fetcher.mockResolvedValue({ data: {} });

    await gqlFetcher('{ users { id } }');

    expect(fetcher).toHaveBeenCalledWith(
      '/graphql',
      expect.objectContaining({
        body: { query: '{ users { id } }', variables: {} }
      })
    );
  });

  it('translates a validation error into a 422 with field-keyed messages', async () => {
    fetcher.mockResolvedValue(
      graphqlError('Validation failed for the field [updateUser].', {
        status: 422,
        validation: { email: ['The email has already been taken.'] }
      })
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
    fetcher.mockResolvedValue(
      graphqlError('Unauthenticated.', { status: 401, guards: ['sanctum'] })
    );

    const error = await expectRejection(gqlFetcher('{ users { id } }'));

    expect(error.statusCode).toBe(401);
    expect(error.data.errors).toBeUndefined();
  });

  it('translates an authorization error into a 403', async () => {
    fetcher.mockResolvedValue(
      graphqlError('This action is unauthorized.', { status: 403 })
    );

    const error = await expectRejection(gqlFetcher('{ users { id } }'));

    expect(error.statusCode).toBe(403);
  });

  it('falls back to 500 with the first message when no status is stated', async () => {
    fetcher.mockResolvedValue(graphqlError('Internal server error'));

    const error = await expectRejection(gqlFetcher('{ users { id } }'));

    expect(error.statusCode).toBe(500);
    // * getErrorMessage() prefers data.message, so this is what the toast shows.
    expect(error.data.message).toBe('Internal server error');
  });

  it('treats a partial result as a failure rather than returning half the data', async () => {
    fetcher.mockResolvedValue({
      data: { users: [{ id: 1 }] },
      errors: [{ message: 'Something failed', extensions: { status: 403 } }]
    });

    const error = await expectRejection(gqlFetcher('{ users { id } }'));

    expect(error.statusCode).toBe(403);
  });

  it('lets a transport-level failure through untouched', async () => {
    const transportError = new FetchError('Network down');

    fetcher.mockRejectedValue(transportError);

    const error = await expectRejection(gqlFetcher('{ users { id } }'));

    expect(error).toBe(transportError);
  });
});
