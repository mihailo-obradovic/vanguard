// * Default (variant/vuetify): 'button, a, textarea, .v-select' — Vuetify's select wraps its
// * focused input in a `.v-select` element, so the guard had to match an ancestor. This project
// * has no component library; a select field is a native `<select>`, which receives the keydown
// * on itself, so it can be matched directly.
const SELF_HANDLING = 'button, a, textarea, select';

// * Confirms on Enter unless the keypress came from an element that already handles Enter itself
// * (a button, link, textarea or select) — those act on the key, so confirming as well would fire
// * twice on one keypress.
export function useConfirmOnEnter(
  confirm: () => void,
  isEnabled: () => boolean
) {
  return function confirmFromEnter(event: KeyboardEvent) {
    if (!isEnabled()) {
      return;
    }
    if ((event.target as HTMLElement).closest(SELF_HANDLING)) {
      return;
    }
    confirm();
  };
}
