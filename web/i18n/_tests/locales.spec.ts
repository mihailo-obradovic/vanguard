import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

type Catalog = { [key: string]: string | Catalog };

// * Read from disk rather than imported: the i18n module precompiles catalog JSON into message ASTs, and these rules are about the source files.
function load(locale: string): Catalog {
  const path = fileURLToPath(
    new URL(`../locales/${locale}.json`, import.meta.url)
  );

  return JSON.parse(readFileSync(path, 'utf8')) as Catalog;
}

const CATALOGS: Record<string, Catalog> = {
  en: load('en'),
  'sr-Latn': load('sr-Latn'),
  'sr-Cyrl': load('sr-Cyrl')
};

// * How many `|` branches a pluralized message needs in each locale: English is one/other, Serbian is one/few/other (web/i18n/i18n.config.ts).
const PLURAL_FORMS: Record<string, number> = {
  en: 2,
  'sr-Latn': 3,
  'sr-Cyrl': 3
};

// * Latin→Cyrillic transliteration is deterministic, so sr-Cyrl is checked against sr-Latn rather than reviewed by hand. Digraphs must be replaced before their component letters.
const DIGRAPHS: [string, string][] = [
  ['Nj', 'Њ'],
  ['NJ', 'Њ'],
  ['nj', 'њ'],
  ['Lj', 'Љ'],
  ['LJ', 'Љ'],
  ['lj', 'љ'],
  ['Dž', 'Џ'],
  ['DŽ', 'Џ'],
  ['dž', 'џ']
];

const LETTERS: Record<string, string> = {
  A: 'А',
  B: 'Б',
  C: 'Ц',
  Č: 'Ч',
  Ć: 'Ћ',
  D: 'Д',
  Đ: 'Ђ',
  E: 'Е',
  F: 'Ф',
  G: 'Г',
  H: 'Х',
  I: 'И',
  J: 'Ј',
  K: 'К',
  L: 'Л',
  M: 'М',
  N: 'Н',
  O: 'О',
  P: 'П',
  R: 'Р',
  S: 'С',
  Š: 'Ш',
  T: 'Т',
  U: 'У',
  V: 'В',
  Z: 'З',
  Ž: 'Ж',
  a: 'а',
  b: 'б',
  c: 'ц',
  č: 'ч',
  ć: 'ћ',
  d: 'д',
  đ: 'ђ',
  e: 'е',
  f: 'ф',
  g: 'г',
  h: 'х',
  i: 'и',
  j: 'ј',
  k: 'к',
  l: 'л',
  m: 'м',
  n: 'н',
  o: 'о',
  p: 'п',
  r: 'р',
  s: 'с',
  š: 'ш',
  t: 'т',
  u: 'у',
  v: 'в',
  z: 'з',
  ž: 'ж'
};

// * Words that stay in Latin script in a Cyrillic catalog, alongside the interpolation placeholders.
const TRANSLITERATION_EXEMPT = ['Vanguard', 'GraphQL', 'REST', 'ID'];

const PROTECTED = new RegExp(
  `\\{[^}]*\\}|${TRANSLITERATION_EXEMPT.join('|')}`,
  'g'
);

// * The mask delimiter is a private-use code point: it cannot occur in catalog text and is absent from the letter map, so protected spans survive transliteration untouched.
function toCyrillic(text: string): string {
  const held: string[] = [];

  let out = text.replace(PROTECTED, (match) => {
    held.push(match);

    return `\uE000${held.length - 1}\uE000`;
  });

  for (const [latin, cyrillic] of DIGRAPHS) {
    out = out.split(latin).join(cyrillic);
  }

  out = Array.from(out, (character) => LETTERS[character] ?? character).join(
    ''
  );

  return out.replace(
    /\uE000(\d+)\uE000/g,
    (_, index: string) => held[Number(index)] ?? ''
  );
}

function flatten(catalog: Catalog, prefix = ''): Record<string, string> {
  return Object.entries(catalog).reduce<Record<string, string>>(
    (flat, [key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'string') {
        flat[path] = value;
      } else {
        Object.assign(flat, flatten(value, path));
      }

      return flat;
    },
    {}
  );
}

function collectKeyOrder(catalog: Catalog, prefix = ''): [string, string[]][] {
  const levels: [string, string[]][] = [
    [prefix || '(root)', Object.keys(catalog)]
  ];

  for (const [key, value] of Object.entries(catalog)) {
    if (typeof value !== 'string') {
      levels.push(...collectKeyOrder(value, prefix ? `${prefix}.${key}` : key));
    }
  }

  return levels;
}

function placeholdersOf(message: string): string[] {
  return (message.match(/\{[^}]*\}/g) ?? []).sort();
}

const FLAT = Object.fromEntries(
  Object.entries(CATALOGS).map(([locale, catalog]) => [
    locale,
    flatten(catalog)
  ])
);

const LOCALES = Object.keys(CATALOGS);
const SOURCE_KEYS = Object.keys(FLAT.en!).sort();

describe('locale catalogs', () => {
  it.each(LOCALES)('%s holds exactly the same keys as en', (locale) => {
    expect(Object.keys(FLAT[locale]!).sort()).toEqual(SOURCE_KEYS);
  });

  it.each(LOCALES)('%s orders keys alphabetically at every level', (locale) => {
    for (const [level, keys] of collectKeyOrder(CATALOGS[locale]!)) {
      expect(keys, `${locale} → ${level}`).toEqual([...keys].sort());
    }
  });

  it.each(LOCALES)('%s keeps the interpolation of every key', (locale) => {
    for (const key of SOURCE_KEYS) {
      expect(placeholdersOf(FLAT[locale]![key]!), `${locale} → ${key}`).toEqual(
        placeholdersOf(FLAT.en![key]!)
      );
    }
  });

  it.each(LOCALES)('%s uses its own number of plural branches', (locale) => {
    for (const key of SOURCE_KEYS) {
      const expected = FLAT.en![key]!.includes('|') ? PLURAL_FORMS[locale] : 1;

      expect(FLAT[locale]![key]!.split('|').length, `${locale} → ${key}`).toBe(
        expected
      );
    }
  });

  it('sr-Cyrl is the transliteration of sr-Latn', () => {
    for (const key of SOURCE_KEYS) {
      expect(FLAT['sr-Cyrl']![key], `sr-Cyrl → ${key}`).toBe(
        toCyrillic(FLAT['sr-Latn']![key]!)
      );
    }
  });

  it('leaves no message untranslated in Serbian', () => {
    const untranslated = SOURCE_KEYS.filter(
      (key) =>
        FLAT['sr-Latn']![key] === FLAT.en![key] &&
        // * Symbols, placeholders, and the exempt tokens legitimately match the English value.
        /\p{Letter}/u.test(FLAT.en![key]!.replace(PROTECTED, ''))
    );

    expect(untranslated).toEqual([]);
  });
});
