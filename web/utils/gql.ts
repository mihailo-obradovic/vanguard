// * Tags a GraphQL document: purely an identity template tag that returns the string unchanged, so editors highlight the literal as GraphQL and validate it against `graphql/schema.graphql`.
// ! Documents are sent as written — the project deliberately runs no GraphQL client and no code generator (`catalyst/decisions/007_infra_graphql-alongside-rest.md`), so nothing catches a mistyped field before runtime.
export function gql(
  strings: TemplateStringsArray,
  ...values: string[]
): string {
  return strings.reduce(
    (document, chunk, index) => document + chunk + (values[index] ?? ''),
    ''
  );
}
