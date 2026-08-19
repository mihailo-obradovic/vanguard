import { email, isFilled, maxLength, required } from '@regle/rules';

import { checkEmailAvailability } from '@/services/user.api';

import type { Maybe } from '@regle/core';

// * Mirrors the backend's `lowercase` rule, which only the endpoints that *write* a user carry (register, users, profile). Login and the reset pair deliberately omit it: the column collates case-insensitively, so a mixed-case address still signs in.
const lowercase = createRule({
  validator(value: Maybe<string>) {
    if (!isFilled(value)) return true;

    return value === value.toLowerCase();
  },
  message: () => useNuxtApp().$i18n.t('validation.lowercase')
});

// * Asks the server whether an address is free, debounced by the field declaring it.
// ! Fails open on purpose. The endpoint is a convenience; the backend's `unique` rule is the authority, so an unreachable or rate-limited check must never block a user who would succeed.
const emailAvailable = createRule({
  async validator(value: Maybe<string>, ignoreId?: number) {
    // * Nothing to ask about until the value is a syntactically valid address — `required` and `email` report those cases, and asking anyway would spend a request on a certain 422.
    if (!isFilled(value) || !email.exec(value)) return true;

    try {
      return await checkEmailAvailability(value, ignoreId);
    } catch {
      return true;
    }
  },
  message: () => useNuxtApp().$i18n.t('validation.emailTaken')
});

// * The email a user types to identify themselves — login, forgot-password, reset. Matches those endpoints exactly: no `lowercase`, and no availability check (the address is meant to exist).
export function credentialEmailRules() {
  return {
    email: labeledRules('validation.fieldNames.email', {
      required,
      email,
      maxLength: maxLength(255)
    })
  };
}

// * The email a user claims — register, admin create/edit, profile. Mirrors the write endpoints, including the availability hint. `ignoreId` is the user being edited, where there is one.
export function accountEmailRules(ignoreId?: () => number | undefined) {
  return {
    email: {
      ...labeledRules('validation.fieldNames.email', {
        required,
        email,
        maxLength: maxLength(255),
        lowercase,
        emailAvailable: emailAvailable(() => ignoreId?.())
      }),
      // * A modifier, not a rule, so it sits beside them rather than inside labeledRules.
      // * 500ms rather than Regle's 200ms default: this is a network call per pause in typing.
      $debounce: 500
    }
  };
}
