import { maxLength, minLength, requiredIf, sameAs } from '@regle/rules';

// * Rules for a password/confirmation pair being set — registration, reset, admin create/edit, and profile. Not for `current_password`, which only ever gates a change.
// * 'set' is register, reset and admin create: the pair is required. 'change' is profile and admin edit: it is required only once a password has been typed, and its inputs are labelled "New password" / "Confirm new password", so the messages must name those fields rather than the "Password" pair.
export type PasswordMode = 'set' | 'change';

// * Accepts a getter as well as a plain value so a form whose mode changes at runtime (create vs edit) re-evaluates without rebuilding its rules.
export function newPasswordRules(
  password: () => string,
  mode: MaybeRefOrGetter<PasswordMode> = 'set'
) {
  const isChange = () => toValue(mode) === 'change';
  const passwordName = () =>
    isChange()
      ? 'validation.fieldNames.newPassword'
      : 'validation.fieldNames.password';
  const confirmationName = () =>
    isChange()
      ? 'validation.fieldNames.confirmNewPassword'
      : 'validation.fieldNames.passwordConfirmation';

  return {
    password: labeledRules(passwordName, {
      required: requiredIf(() => !isChange()),
      minLength: minLength(8),
      // * Mirrors `Password::defaults()` — 8–255. The ceiling is bcrypt's 72-byte truncation made explicit; without it the server would 422 on a length the form said nothing about.
      maxLength: maxLength(255)
    }),
    password_confirmation: labeledRules(confirmationName, {
      requiredIf: requiredIf(() => !isChange() || !!password()),
      sameAs: sameAs(password, 'password')
    })
  };
}
