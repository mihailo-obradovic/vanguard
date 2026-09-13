import type { MaybeRefOrGetter } from 'vue';

/**
 * Where focus goes when a Reka overlay closes, for the case Reka cannot handle: the control that opened it is gone.
 *
 * Reka's FocusScope restores focus to whatever was focused when the overlay mounted, and focusing a detached element does nothing — so a dialog opened from inside another dialog (a hand-off), from a drawer that has since closed, or from a table row that has since been deleted leaves focus on `<body>`, and the next Tab starts from the top of the document.
 *
 * Bind the returned handler to the content's `close-auto-focus`. While the opener is still in the document Reka's own restore runs untouched; otherwise focus goes to `origin` — the control the owner says started this chain — and failing that to the page's `#main-content` landmark.
 */
export function useFocusReturn(
  open: MaybeRefOrGetter<boolean>,
  origin: MaybeRefOrGetter<HTMLElement | null | undefined> = null
) {
  let opener: Element | null = null;

  // ! `sync`: the opener has to be read before the overlay renders and Reka moves focus into it.
  watch(
    () => toValue(open),
    (isOpen) => {
      if (isOpen) {
        opener = document.activeElement;
      }
    },
    { flush: 'sync' }
  );

  function restoreFocus(event: Event) {
    if (opener?.isConnected) {
      return;
    }

    event.preventDefault();

    const target = [
      toValue(origin),
      document.getElementById('main-content')
    ].find((element) => element?.isConnected);

    target?.focus();
  }

  return { restoreFocus };
}
