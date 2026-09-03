// ! Helper first, default export last: @nuxtjs/i18n's transform fails to parse this file when anything follows the export, which breaks every suite that loads a message catalog. The principal-export-first rule's framework-imposed-order carve-out (`catalyst/conventions/code-style.md`) covers it.
// * Serbian pluralization: `one` for n1 except 11, `few` for n2-4 except 12-14, `other` for the rest. Vue I18n's default rule is two-branch and English-shaped, so every pluralized Serbian key needs three `|` branches and this rule to pick between them.
function serbianPluralRule(choice: number): number {
  const mod10 = choice % 10;
  const mod100 = choice % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return 0;
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return 1;
  }

  return 2;
}

export default defineI18nConfig(() => ({
  legacy: false,
  fallbackLocale: 'en',
  pluralRules: {
    'sr-Latn': serbianPluralRule,
    'sr-Cyrl': serbianPluralRule
  }
}));
