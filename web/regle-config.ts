import { defineRegleConfig } from '@regle/core';
import { defineRegleNuxtPlugin } from '@regle/nuxt/setup';
import {
  email,
  maxLength,
  minLength,
  required,
  requiredIf,
  sameAs,
  withMessage
} from '@regle/rules';

// * Replaces the English messages @regle/rules ships with, so validation text follows the active locale like the rest of the UI. The rules factory runs per form, which is what lets `t` re-resolve when the locale changes.
export default defineRegleNuxtPlugin(() =>
  defineRegleConfig({
    rules: () => {
      const { t } = useI18n();

      return {
        email: withMessage(email, () => t('validation.email')),
        maxLength: withMessage(maxLength, ({ $params: [max] }) =>
          t('validation.maxLength', { max })
        ),
        minLength: withMessage(minLength, ({ $params: [min] }) =>
          t('validation.minLength', { min })
        ),
        required: withMessage(required, () => t('validation.required')),
        // ! Messages are matched by the key a form declares a rule under, not by the rule's internal type — a field declaring `requiredIf` skips the `required` entry, so it needs its own.
        requiredIf: withMessage(requiredIf, () => t('validation.required')),
        sameAs: withMessage(sameAs, () => t('validation.sameAs'))
      };
    }
  })
);
