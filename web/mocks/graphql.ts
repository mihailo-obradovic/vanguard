import { http, HttpResponse } from 'msw';

import { apiUrl } from './api';

import type { JsonBodyType } from 'msw';

export const GRAPHQL_PATH = '/graphql';

/**
 * Answer the GraphQL endpoint with `payload`.
 *
 * * GraphQL reports failures as HTTP 200 with an `errors` array, so success and failure use the
 * * same handler — only the body differs.
 */
export function graphqlHandler(payload: JsonBodyType) {
  return http.post(apiUrl(GRAPHQL_PATH), () => HttpResponse.json(payload));
}
