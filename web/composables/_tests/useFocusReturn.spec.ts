// @vitest-environment nuxt
import { describe, it, expect, afterEach } from 'vitest';

import { useFocusReturn } from '../useFocusReturn';

function button(label: string) {
  const element = document.createElement('button');

  element.textContent = label;
  document.body.appendChild(element);

  return element;
}

function mainLandmark() {
  const main = document.createElement('main');

  main.id = 'main-content';
  main.tabIndex = -1;
  document.body.appendChild(main);

  return main;
}

/** Focus the opener, open, then close with `beforeClose` run in between — the order a real dialog goes through. */
function openAndClose(
  opener: HTMLElement,
  origin: HTMLElement | null,
  beforeClose: () => void = () => {}
) {
  const open = ref(false);
  const { restoreFocus } = useFocusReturn(open, () => origin);

  opener.focus();
  open.value = true;
  beforeClose();
  open.value = false;

  const event = new Event('focus.autoFocusOnUnmount', { cancelable: true });

  restoreFocus(event);

  return event;
}

describe('useFocusReturn', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  // * Reka's own restore reaches a connected opener, so the handler must not cancel it.
  it('leaves the restore to Reka while the opener is still in the document', () => {
    const opener = button('Login');

    const event = openAndClose(opener, button('Origin'));

    expect(event.defaultPrevented).toBe(false);
  });

  it('sends focus to the origin once the opener is gone', () => {
    const opener = button('Register here');
    const origin = button('Login');

    const event = openAndClose(opener, origin, () => opener.remove());

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(origin);
  });

  it('falls back to the main landmark when there is no origin', () => {
    const opener = button('Delete');
    const main = mainLandmark();

    openAndClose(opener, null, () => opener.remove());

    expect(document.activeElement).toBe(main);
  });

  it('skips an origin that is itself gone', () => {
    const opener = button('Login');
    const origin = button('Menu');
    const main = mainLandmark();

    openAndClose(opener, origin, () => {
      opener.remove();
      origin.remove();
    });

    expect(document.activeElement).toBe(main);
  });

  it('leaves focus alone when there is nowhere to send it', () => {
    const opener = button('Delete');

    const event = openAndClose(opener, null, () => opener.remove());

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(document.body);
  });

  // ! The opener is read when the dialog opens, not when it closes: by close time focus is inside the dialog, and reading it then would always look connected.
  it('remembers the element focused when the dialog opened', () => {
    const opener = button('Register here');
    const inside = button('Cancel');
    const origin = button('Login');

    const event = openAndClose(opener, origin, () => {
      inside.focus();
      opener.remove();
    });

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(origin);
  });
});
