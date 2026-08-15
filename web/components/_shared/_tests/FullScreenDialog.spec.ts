// @vitest-environment nuxt
import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderSuspended } from '@nuxt/test-utils/runtime';
import { screen, fireEvent, cleanup } from '@testing-library/vue';
import { createVuetify } from 'vuetify';

import FullScreenDialog from '../FullScreenDialog.vue';

// ! happy-dom has no `visualViewport`, and Vuetify's overlay positioning reaches for it as a bare
// ! global — optional chaining does not save an *undeclared* name from a ReferenceError.
vi.stubGlobal('visualViewport', null);

type FullScreenDialogProps = InstanceType<typeof FullScreenDialog>['$props'];

/** Vuetify needs supplying by hand — `renderSuspended` does not run the Nuxt plugin that installs it. */
function renderDialog(
  props: Partial<FullScreenDialogProps> = {},
  slots: Record<string, string> = {}
) {
  return renderSuspended(FullScreenDialog, {
    props: { modelValue: true, title: 'Edit user', ...props },
    slots,
    global: { plugins: [createVuetify()] }
  });
}

function button(name: string) {
  return screen.getByRole('button', { name });
}

/** Enter reaches the sheet by bubbling, exactly as it does from a real focused field. */
function pressEnterOn(element: Element) {
  return fireEvent.keyDown(element, { key: 'Enter' });
}

describe('FullScreenDialog', () => {
  afterEach(() => {
    cleanup();
    // ! The dialog teleports to body, outside the container `cleanup` owns.
    document.body.innerHTML = '';
  });

  it('heads the toolbar with the title it was given', async () => {
    await renderDialog();

    expect(screen.getByText('Edit user')).toBeTruthy();
  });

  it('shows the content it was handed', async () => {
    await renderDialog({}, { default: '<p>Some field</p>' });

    expect(screen.getByText('Some field')).toBeTruthy();
  });

  it('offers a way out through the toolbar', async () => {
    const { emitted } = await renderDialog();

    await fireEvent.click(button('Close'));

    expect(emitted().cancel).toHaveLength(1);
  });

  it('saves through the toolbar', async () => {
    const { emitted } = await renderDialog();

    await fireEvent.click(button('Save'));

    expect(emitted().confirm).toHaveLength(1);
  });

  it('holds the save back while it is disabled', async () => {
    const { emitted } = await renderDialog({ confirmDisabled: true });

    await fireEvent.click(button('Save'));

    expect(emitted().confirm).toBeUndefined();
  });

  // ! Unlike FormCard this dialog has no `confirmOnEnter` opt-out — Enter always confirms, which
  // ! is why the two guards below are the only thing standing between a keypress and a save.
  it('saves when Enter is pressed in the body', async () => {
    const { emitted } = await renderDialog(
      {},
      { default: '<p>Some field</p>' }
    );

    await pressEnterOn(screen.getByText('Some field'));

    expect(emitted().confirm).toHaveLength(1);
  });

  it('ignores Enter while the save is disabled', async () => {
    const { emitted } = await renderDialog(
      { confirmDisabled: true },
      { default: '<p>Some field</p>' }
    );

    await pressEnterOn(screen.getByText('Some field'));

    expect(emitted().confirm).toBeUndefined();
  });

  it('ignores Enter while a save is already in flight', async () => {
    const { emitted } = await renderDialog(
      { loading: true },
      { default: '<p>Some field</p>' }
    );

    await pressEnterOn(screen.getByText('Some field'));

    expect(emitted().confirm).toBeUndefined();
  });

  // ! Interactive elements act on Enter themselves; saving here as well would fire on the same
  // ! keypress that pressed a button or typed a newline.
  it.each([
    ['a button', '<button>Add another</button>', 'Add another'],
    ['a link', '<a href="/help">Help</a>', 'Help'],
    ['a textarea', '<textarea>Notes</textarea>', 'Notes']
  ])(
    'leaves Enter to %s that handles it itself',
    async (_what, markup, text) => {
      const { emitted } = await renderDialog({}, { default: markup });

      await pressEnterOn(screen.getByText(text));

      expect(emitted().confirm).toBeUndefined();
    }
  );
});
