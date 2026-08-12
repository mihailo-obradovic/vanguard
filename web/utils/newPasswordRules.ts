import { minLength, requiredIf, sameAs } from '@regle/rules';

// * Rules for a password/confirmation pair being set — registration, reset, admin create/edit, and profile. Not for `current_password`, which only ever gates a change.
// * `optional` accepts a getter as well as a plain boolean so a form whose mode changes at runtime (create vs edit) re-evaluates without rebuilding its rules. When it holds, the pair is only required once a password has been typed.
export function newPasswordRules(
  password: () => string,
  optional: MaybeRefOrGetter<boolean> = false
) {
  return {
    password: {
      required: requiredIf(() => !toValue(optional)),
      minLength: minLength(8)
    },
    password_confirmation: {
      requiredIf: requiredIf(() => !toValue(optional) || !!password()),
      sameAs: sameAs(password, 'password')
    }
  };
}
