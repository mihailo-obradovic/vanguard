// @vitest-environment nuxt
import { describe, expect, it } from 'vitest';
import { en, srCyrl, srLatn } from 'vuetify/locale';

import i18nConfig from '../i18n.config';

const config = await i18nConfig();

// * The rule is called with the count and returns the index of the `|` branch to use, so the
// * assertions read as "this many items picks the first/second/third form".
const ONE = 0;
const FEW = 1;
const OTHER = 2;

describe('i18n.config', () => {
  it('falls back to English', () => {
    expect(config.fallbackLocale).toBe('en');
  });

  describe.each([
    ['sr-Latn', config.pluralRules['sr-Latn']],
    ['sr-Cyrl', config.pluralRules['sr-Cyrl']]
  ])('the %s plural rule', (_locale, pick) => {
    it('picks the one-form for counts ending in a single 1', () => {
      expect(pick(1)).toBe(ONE);
      expect(pick(21)).toBe(ONE);
      expect(pick(101)).toBe(ONE);
    });

    it('picks the few-form for counts ending in 2 through 4', () => {
      expect(pick(2)).toBe(FEW);
      expect(pick(4)).toBe(FEW);
      expect(pick(22)).toBe(FEW);
    });

    it('picks the other-form for counts ending in 5 through 9 and 0', () => {
      expect(pick(0)).toBe(OTHER);
      expect(pick(5)).toBe(OTHER);
      expect(pick(25)).toBe(OTHER);
    });

    // ! The teens are the exception the rule exists for: 11 and 12-14 look like 1 and 2-4 by their
    // ! last digit but take the other-form.
    it('picks the other-form for the teens, despite their last digit', () => {
      expect(pick(11)).toBe(OTHER);
      expect(pick(12)).toBe(OTHER);
      expect(pick(14)).toBe(OTHER);
      expect(pick(111)).toBe(OTHER);
    });
  });

  it('leaves English on Vue I18n’s default rule', () => {
    expect('en' in config.pluralRules).toBe(false);
  });

  // * Vuetify's own strings reach the app through these trees; without them the locale adapter in
  // * plugins/vuetify.ts resolves $vuetify.* keys to nothing.
  it('mounts Vuetify’s strings under $vuetify for every locale', () => {
    expect(config.messages.en.$vuetify).toBe(en);
    expect(config.messages['sr-Latn'].$vuetify).toBe(srLatn);
    expect(config.messages['sr-Cyrl'].$vuetify).toBe(srCyrl);
  });
});
