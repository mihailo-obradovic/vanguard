// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest';

import { useConfirmOnEnter } from '../useConfirmOnEnter';

// * Builds `<tag class>` nested outermost-first and returns a keypress from the innermost one — the handler only ever reads `event.target`, so a detached node stands in faithfully for a real bubbled keypress. The components' own specs cover the bubbling.
function enterFrom(
  ...tags: [tag: string, className?: string][]
): KeyboardEvent {
  let target: HTMLElement = document.createElement('div');

  for (const [tag, className] of tags) {
    const child = document.createElement(tag);

    if (className) {
      child.className = className;
    }

    target.appendChild(child);
    target = child;
  }

  return { target } as unknown as KeyboardEvent;
}

const PLAIN_TEXT = enterFrom(['span']);

describe('useConfirmOnEnter', () => {
  it('confirms on a keypress from an element that does not handle Enter itself', () => {
    const confirm = vi.fn<() => void>();

    useConfirmOnEnter(confirm, () => true)(PLAIN_TEXT);

    expect(confirm).toHaveBeenCalledOnce();
  });

  it('stays out of the way while the surface says it is not enabled', () => {
    const confirm = vi.fn<() => void>();

    useConfirmOnEnter(confirm, () => false)(PLAIN_TEXT);

    expect(confirm).not.toHaveBeenCalled();
  });

  it('re-reads the enabled getter on every keypress, not once at build time', () => {
    const confirm = vi.fn<() => void>();
    let enabled = false;

    const handleEnterKey = useConfirmOnEnter(confirm, () => enabled);

    handleEnterKey(PLAIN_TEXT);
    enabled = true;
    handleEnterKey(PLAIN_TEXT);

    expect(confirm).toHaveBeenCalledOnce();
  });

  // ! These act on Enter themselves, so confirming as well fires twice on one keypress. The list had already drifted — UserCard guarded only buttons and links — which is why it lives in one place now.
  it.each<[string, KeyboardEvent]>([
    ['a button', enterFrom(['button'])],
    ['a link', enterFrom(['a'])],
    ['a textarea', enterFrom(['textarea'])],
    // * Vuetify's select puts the focused input inside the `.v-select` wrapper, so the guard has to match an ancestor rather than the target itself.
    ['a select', enterFrom(['div', 'v-select'], ['input'])]
  ])('leaves Enter to %s that handles it itself', (_name, event) => {
    const confirm = vi.fn<() => void>();

    useConfirmOnEnter(confirm, () => true)(event);

    expect(confirm).not.toHaveBeenCalled();
  });
});
