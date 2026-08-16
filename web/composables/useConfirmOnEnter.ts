// * Elements that act on Enter themselves — a button clicks, a link follows, a textarea takes a newline, a select toggles its menu. Confirming as well would fire twice on one keypress.
const SELF_HANDLING = 'button, a, textarea, .v-select';

// * Builds the `@keydown.enter` handler behind the Enter-confirms contract (`catalyst/stacks/frontend/nuxt/ui/vuetify/components.md`), so the list of elements that keep Enter to themselves is stated once rather than per surface.
// * `isEnabled` is each surface's own reason to stay out of the way: a disabled or in-flight confirm, an opt-out prop, a card that is not in edit mode.
export function useConfirmOnEnter(
  confirm: () => void,
  isEnabled: () => boolean
) {
  return function handleEnterKey(event: KeyboardEvent) {
    if (!isEnabled()) {
      return;
    }

    if ((event.target as HTMLElement).closest(SELF_HANDLING)) {
      return;
    }

    confirm();
  };
}
