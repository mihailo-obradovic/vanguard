/**
 * Tag a GraphQL document.
 *
 * Purely an identity template tag — it returns the string unchanged. Its job is to mark the
 * literal as GraphQL so editors highlight it and validate it against `graphql/schema.graphql`.
 * Documents are sent as written; the project deliberately runs no GraphQL client and no code
 * generator (`catalyst/decisions/007_infra_graphql-alongside-rest.md`).
 */
export function gql(
  strings: TemplateStringsArray,
  ...values: string[]
): string {
  return strings.reduce(
    (document, chunk, index) => document + chunk + (values[index] ?? ''),
    ''
  );
}
