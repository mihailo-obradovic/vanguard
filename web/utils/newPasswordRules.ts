import { maxLength, minLength, requiredIf, sameAs } from '@regle/rules';

// * Rules for a password/confirmation pair being set — registration, reset, admin create/edit, and profile. Not for `current_password`, which only ever gates a change.
// * `optional` accepts a getter as well as a plain boolean so a form whose mode changes at runtime (create vs edit) re-evaluates without rebuilding its rules. When it holds, the pair is only required once a password has been typed.
export function newPasswordRules(
  password: () => string,
  optional: MaybeRefOrGetter<boolean> = false
) {
  // * An optional pair is a change-password form: its inputs are labelled "New password" / "Confirm new password", so the messages must name those fields — not the "Password" pair a set-password form (register, reset, create) renders.
  const passwordName = () =>
    toValue(optional)
      ? 'validation.fieldNames.newPassword'
      : 'validation.fieldNames.password';
  const confirmationName = () =>
    toValue(optional)
      ? 'validation.fieldNames.confirmNewPassword'
      : 'validation.fieldNames.passwordConfirmation';

  return {
    password: labeledRules(passwordName, {
      required: requiredIf(() => !toValue(optional)),
      minLength: minLength(8),
      // * Mirrors `Password::defaults()` — 8–255. The ceiling is bcrypt's 72-byte truncation made
      // * explicit; without it the server would 422 on a length the form said nothing about.
      maxLength: maxLength(255)
    }),
    password_confirmation: labeledRules(confirmationName, {
      requiredIf: requiredIf(() => !toValue(optional) || !!password()),
      sameAs: sameAs(password, 'password')
    })
  };
}
