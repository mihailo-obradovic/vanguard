import { defineRegleConfig } from '@regle/core';
import { defineRegleNuxtPlugin } from '@regle/nuxt/setup';
import {
  email,
  maxLength,
  minLength,
  required,
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
        sameAs: withMessage(sameAs, () => t('validation.sameAs'))
      };
    }
  })
);
