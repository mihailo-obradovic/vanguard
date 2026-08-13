import { withMessage } from '@regle/rules';

import type { RegleRuleDefinition, RegleRuleRaw } from '@regle/core';

// * Message key per declared rule name; `requiredIf` reuses the required copy. Rules absent here (custom or exotic ones) keep the message they already carry.
const MESSAGE_KEYS: Record<string, string> = {
  email: 'validation.field.email',
  maxLength: 'validation.field.maxLength',
  minLength: 'validation.field.minLength',
  required: 'validation.field.required',
  requiredIf: 'validation.field.required',
  sameAs: 'validation.field.sameAs'
};

// * Wraps each rule of one field with a message naming that field, e.g. "The Email field is required." Regle's message context does not expose the field name, so the label has to be attached here, where the field is known — the generic messages in regle-config.ts remain the fallback for unwrapped rules.
// * `labelKey` is a catalog key (usually `common.fields.*`); both it and the message resolve lazily inside the getter, so an open form re-renders its errors when the locale changes.
export function labeledRules<TRules extends Record<string, RegleRuleRaw>>(
  labelKey: string,
  rules: TRules
): TRules {
  return Object.fromEntries(
    Object.entries(rules).map(([ruleName, rule]) => {
      const messageKey = MESSAGE_KEYS[ruleName];

      if (!messageKey) return [ruleName, rule];

      const labeled = withMessage(
        rule as RegleRuleDefinition<string, unknown, unknown[]>,
        ({ $params }) => {
          const { t } = useNuxtApp().$i18n;

          // * Interpolates more than any single message uses; each message picks what it names.
          return t(messageKey, {
            field: t(labelKey),
            max: $params?.[0],
            min: $params?.[0]
          });
        }
      );

      return [ruleName, labeled];
    })
  ) as TRules;
}
