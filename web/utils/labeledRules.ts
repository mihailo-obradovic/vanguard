import { withMessage } from '@regle/rules';

import type { RegleRuleDefinition, RegleRuleRaw } from '@regle/core';

// * Message key per declared rule name; `requiredIf` reuses the required copy. Rules absent here (custom or exotic ones) keep the message they already carry.
const MESSAGE_KEYS: Record<string, string> = {
  email: 'validation.field.email',
  emailAvailable: 'validation.field.emailTaken',
  lowercase: 'validation.field.lowercase',
  maxLength: 'validation.field.maxLength',
  minLength: 'validation.field.minLength',
  required: 'validation.field.required',
  requiredIf: 'validation.field.required',
  sameAs: 'validation.field.sameAs'
};

// * Wraps each rule of one field with a message naming that field, e.g. "The email field is required." Regle's message context does not expose the field name, so the name has to be attached here, where the field is known — the generic messages in regle-config.ts remain the fallback for unwrapped rules.
// * `nameKey` is a `validation.fieldNames.*` key, not the `common.fields.*` label the input renders: the name sits mid-sentence in English and so is lowercase there, while the label is capitalized. Serbian sets it in quotation marks and keeps the label's own casing, which is why this is two catalog entries rather than a transform.
// * Both the name and the message resolve lazily inside the getter, so an open form re-renders its errors when the locale changes. `nameKey` may itself be a getter for fields whose visible label switches with a form mode (create vs edit), so the message always names the label the user is looking at.
export function labeledRules<TRules extends Record<string, RegleRuleRaw>>(
  nameKey: MaybeRefOrGetter<string>,
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
            field: t(toValue(nameKey)),
            max: $params?.[0],
            min: $params?.[0]
          });
        }
      );

      return [ruleName, labeled];
    })
  ) as TRules;
}
