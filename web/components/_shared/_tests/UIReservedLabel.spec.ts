// @vitest-environment nuxt
import { describe, it, expect, afterEach } from 'vitest';
import { renderSuspended } from '@nuxt/test-utils/runtime';
import { cleanup } from '@testing-library/vue';

import UIReservedLabel from '../UIReservedLabel.vue';

const VARIANTS = { idle: 'Delete', pending: 'Deleting...' };

function render(active: keyof typeof VARIANTS) {
  return renderSuspended(UIReservedLabel, {
    props: { variants: VARIANTS, active }
  });
}

/** The text left once every aria-hidden subtree is dropped — what a screen reader is actually offered. */
function announcedText(container: Element) {
  const copy = container.cloneNode(true) as Element;

  for (const hidden of copy.querySelectorAll('[aria-hidden="true"]')) {
    hidden.remove();
  }

  return copy.textContent?.trim();
}

describe('UIReservedLabel', () => {
  afterEach(cleanup);

  it('shows the active variant', async () => {
    const { container } = await render('idle');

    expect(
      container.querySelector('.ui-reserved-label-shown')?.textContent
    ).toBe('Delete');
  });

  it('keeps every other variant in the box so the widest one reserves it', async () => {
    const { container } = await render('idle');

    // * Both ghosts stay rendered on either state — that is the reservation. Dropping the inactive one would give the space back and reintroduce the jump.
    const ghosts = [...container.querySelectorAll('.ui-reserved-label-ghost')];

    expect(ghosts.map((ghost) => ghost.textContent)).toEqual([
      'Delete',
      'Deleting...'
    ]);
  });

  it('reserves the same set once the state has changed', async () => {
    const { container } = await render('pending');

    expect(
      container.querySelector('.ui-reserved-label-shown')?.textContent
    ).toBe('Deleting...');
    expect(container.querySelectorAll('.ui-reserved-label-ghost')).toHaveLength(
      2
    );
  });

  it('hides the ghosts from assistive technology', async () => {
    const { container } = await render('idle');

    for (const ghost of container.querySelectorAll(
      '.ui-reserved-label-ghost'
    )) {
      expect(ghost.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('announces the active variant once, not every state', async () => {
    const { container } = await render('pending');

    // * A control that reads out all of its states is worse than the jump the ghosts prevent.
    expect(announcedText(container)).toBe('Deleting...');
  });
});
