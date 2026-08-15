// @vitest-environment nuxt
import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderSuspended } from '@nuxt/test-utils/runtime';
import { screen, fireEvent, cleanup } from '@testing-library/vue';
import { createVuetify } from 'vuetify';

import FormCard from '../FormCard.vue';

// ! happy-dom has no `visualViewport`, and Vuetify's overlay positioning reaches for it as a bare
// ! global — optional chaining does not save an *undeclared* name from a ReferenceError.
vi.stubGlobal('visualViewport', null);

type FormCardProps = InstanceType<typeof FormCard>['$props'];

/** Vuetify needs supplying by hand — `renderSuspended` does not run the Nuxt plugin that installs it. */
function renderCard(
  props: Partial<FormCardProps> = {},
  slots: Record<string, string> = {}
) {
  return renderSuspended(FormCard, {
    props: { title: 'Edit user', ...props },
    slots,
    global: { plugins: [createVuetify()] }
  });
}

function button(name: string) {
  return screen.getByRole('button', { name });
}

/** Enter reaches the card by bubbling, exactly as it does from a real focused field. */
function pressEnterOn(element: Element) {
  return fireEvent.keyDown(element, { key: 'Enter' });
}

describe('FormCard', () => {
  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  it('heads the card with the title it was given', async () => {
    await renderCard();

    expect(screen.getByText('Edit user')).toBeTruthy();
  });

  it('lets a title slot replace the plain title', async () => {
    await renderCard({}, { title: '<span>Two of three steps done</span>' });

    expect(screen.getByText('Two of three steps done')).toBeTruthy();
    expect(screen.queryByText('Edit user')).toBeNull();
  });

  it('offers a way to cancel and a way to confirm', async () => {
    const { emitted } = await renderCard();

    await fireEvent.click(button('Cancel'));
    await fireEvent.click(button('Confirm'));

    expect(emitted().cancel).toHaveLength(1);
    expect(emitted().confirm).toHaveLength(1);
  });

  // ! The default buttons live in a slot fallback, so a parent that supplies `actions` replaces
  // ! them entirely — a dialog with its own button row must not end up with two of them.
  it('lets an actions slot replace the default buttons', async () => {
    await renderCard({}, { actions: '<button>Close</button>' });

    expect(button('Close')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Confirm' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull();
  });

  it('holds the confirmation back while it is disabled', async () => {
    const { emitted } = await renderCard({ confirmDisabled: true });

    await fireEvent.click(button('Confirm'));

    expect(emitted().confirm).toBeUndefined();
  });

  it('confirms when Enter is pressed in the body', async () => {
    const { emitted } = await renderCard({}, { default: '<p>Some field</p>' });

    await pressEnterOn(screen.getByText('Some field'));

    expect(emitted().confirm).toHaveLength(1);
  });

  it('leaves Enter alone for a card that opts out of it', async () => {
    const { emitted } = await renderCard(
      { confirmOnEnter: false },
      { default: '<p>Some field</p>' }
    );

    await pressEnterOn(screen.getByText('Some field'));

    expect(emitted().confirm).toBeUndefined();
  });

  it('ignores Enter while the confirmation is disabled', async () => {
    const { emitted } = await renderCard(
      { confirmDisabled: true },
      { default: '<p>Some field</p>' }
    );

    await pressEnterOn(screen.getByText('Some field'));

    expect(emitted().confirm).toBeUndefined();
  });

  it('ignores Enter while a confirmation is already in flight', async () => {
    const { emitted } = await renderCard(
      { loading: true },
      { default: '<p>Some field</p>' }
    );

    await pressEnterOn(screen.getByText('Some field'));

    expect(emitted().confirm).toBeUndefined();
  });

  // ! Interactive elements act on Enter themselves; confirming here as well would submit the form
  // ! on the same keypress that pressed a button or typed a newline.
  it.each([
    ['a button', '<button>Add another</button>', 'Add another'],
    ['a link', '<a href="/help">Help</a>', 'Help'],
    ['a textarea', '<textarea>Notes</textarea>', 'Notes']
  ])(
    'leaves Enter to %s that handles it itself',
    async (_what, markup, text) => {
      const { emitted } = await renderCard({}, { default: markup });

      await pressEnterOn(screen.getByText(text));

      expect(emitted().confirm).toBeUndefined();
    }
  );
});
