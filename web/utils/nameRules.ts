import { maxLength, required } from '@regle/rules';

// * The display name every form collects — register, the admin create/edit dialog, the GraphQL edit dialog, and the profile form. Mirrors the backend's `required|max:255` on all four, and labels its messages so a form does not mix the field-named voice with the generic one.
export function nameRules() {
  return {
    name: labeledRules('validation.fieldNames.name', {
      required,
      maxLength: maxLength(255)
    })
  };
}
