import { describe, it, expect } from 'vitest';

import { gql } from '../gql';

// * Documents are asserted through direct calls rather than tagged literals wherever the exact
// * text is the point: oxfmt reformats a `gql` template as GraphQL, so its whitespace belongs
// * to the formatter, not to the test.
function templateParts(...strings: string[]): TemplateStringsArray {
  return Object.assign([...strings], {
    raw: [...strings]
  }) as unknown as TemplateStringsArray;
}

describe('gql', () => {
  it('returns the document unchanged', () => {
    const document = '{ users { id } }';

    expect(gql(templateParts(document))).toBe(document);
  });

  it('splices an interpolated fragment in where it appears', () => {
    const fields = 'id name';

    expect(gql`query Users { users { ${fields} } }`).toBe(
      'query Users { users { id name } }'
    );
  });

  it('keeps multiple interpolations in order', () => {
    expect(gql`${'a'}-${'b'}-${'c'}`).toBe('a-b-c');
  });

  it('closes a document that ends on an interpolation', () => {
    // * One more string chunk than values — the trailing chunk has no value to pair with.
    expect(gql(templateParts('users(role: "', '")'), 'admin')).toBe(
      'users(role: "admin")'
    );
  });

  it('preserves the whitespace of a multi-line document', () => {
    const document = gql`
      query Users {
        users {
          id
        }
      }
    `;

    expect(document).toBe(`
      query Users {
        users {
          id
        }
      }
    `);
  });
});
