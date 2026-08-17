// @vitest-environment nuxt
import { describe, it, expect, afterEach } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { renderSuspended } from '@nuxt/test-utils/runtime';
import { screen, fireEvent, cleanup, waitFor } from '@testing-library/vue';

import UIDialog from '../UIDialog.vue';

const TITLE = 'Edit User';

function dialog() {
  return screen.queryByRole('dialog', { name: TITLE });
}

/**
 * An open dialog holding two focusable controls — the minimum a trap can be observed with.
 *
 * ! `renderSuspended` renders into Testing Library's container, and the dialog is a fixed overlay
 * ! inside it; nothing here teleports, so `cleanup` reclaims it.
 */
async function openDialogWithTwoButtons(props: Record<string, unknown> = {}) {
  await renderSuspended(UIDialog, {
    props: { open: true, title: TITLE, ...props },
    slots: {
      default: () => [
        h('button', { type: 'button' }, 'First'),
        h('button', { type: 'button' }, 'Last')
      ]
    }
  });

  return {
    panel: dialog() as HTMLElement,
    first: screen.getByRole('button', { name: 'First' }),
    last: screen.getByRole('button', { name: 'Last' })
  };
}

describe('UIDialog', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders nothing while it is closed', async () => {
    await renderSuspended(UIDialog, {
      props: { open: false, title: TITLE }
    });

    expect(dialog()).toBeNull();
  });

  it('names itself by its title and declares itself modal', async () => {
    const { panel } = await openDialogWithTwoButtons();

    expect(panel).not.toBeNull();
    expect(panel.getAttribute('aria-modal')).toBe('true');
  });

  it('moves focus into the dialog when it opens', async () => {
    const opened = ref(false);

    const page = defineComponent({
      setup() {
        return () =>
          h(UIDialog, {
            open: opened.value,
            title: TITLE
          });
      }
    });

    await renderSuspended(page);

    opened.value = true;

    await waitFor(() => expect(document.activeElement).toBe(dialog()));
  });

  // ! Restoring focus is the half of the contract that is invisible until a keyboard user closes a
  // ! dialog and finds themselves back at the top of the page.
  it('hands focus back to the control it was opened from when it closes', async () => {
    const opened = ref(false);

    const page = defineComponent({
      setup() {
        return () => [
          h(
            'button',
            { type: 'button', onClick: () => (opened.value = true) },
            'Open'
          ),
          h(UIDialog, { open: opened.value, title: TITLE })
        ];
      }
    });

    await renderSuspended(page);

    const opener = screen.getByRole('button', { name: 'Open' });

    opener.focus();
    await fireEvent.click(opener);
    await waitFor(() => expect(document.activeElement).toBe(dialog()));

    opened.value = false;

    await waitFor(() => expect(document.activeElement).toBe(opener));
  });

  it('asks to close on Escape', async () => {
    const closes: unknown[] = [];

    await renderSuspended(UIDialog, {
      props: { open: true, title: TITLE, onClose: () => closes.push(true) },
      slots: { default: () => h('input', { type: 'text' }) }
    });

    // * From the field, not the panel: Escape has to survive the bubble up from whatever holds focus.
    await fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });

    expect(closes).toHaveLength(1);
  });

  it('asks to close when the overlay is clicked, but not the dialog itself', async () => {
    const closes: unknown[] = [];

    await renderSuspended(UIDialog, {
      props: { open: true, title: TITLE, onClose: () => closes.push(true) }
    });

    const panel = dialog() as HTMLElement;

    await fireEvent.click(panel);

    expect(closes).toHaveLength(0);

    await fireEvent.click(panel.parentElement as HTMLElement);

    expect(closes).toHaveLength(1);
  });

  // ! Without the trap, Tab from the last control walks into the page behind the overlay — which is
  // ! still rendered, still focusable and still clickable.
  it('wraps Tab from the last control back to the first', async () => {
    const { panel, first, last } = await openDialogWithTwoButtons();

    last.focus();

    await fireEvent.keyDown(panel, { key: 'Tab' });

    expect(document.activeElement).toBe(first);
  });

  it('wraps Shift+Tab from the first control to the last', async () => {
    const { panel, first, last } = await openDialogWithTwoButtons();

    first.focus();

    await fireEvent.keyDown(panel, { key: 'Tab', shiftKey: true });

    expect(document.activeElement).toBe(last);
  });

  // * The panel itself is the focus target on open, so Shift+Tab from there has to wrap as well —
  // * otherwise the very first key a keyboard user presses leaves the dialog.
  it('wraps Shift+Tab from the panel to the last control', async () => {
    const { panel, last } = await openDialogWithTwoButtons();

    panel.focus();

    await fireEvent.keyDown(panel, { key: 'Tab', shiftKey: true });

    expect(document.activeElement).toBe(last);
  });

  // * Only the edges wrap. A Tab anywhere in the middle is the browser's to handle, and hijacking
  // * it would break the ordinary walk through a form.
  it('leaves a Tab between two controls to the browser', async () => {
    await renderSuspended(UIDialog, {
      props: { open: true, title: TITLE },
      slots: {
        default: () => [
          h('button', { type: 'button' }, 'First'),
          h('button', { type: 'button' }, 'Middle'),
          h('button', { type: 'button' }, 'Last')
        ]
      }
    });

    const middle = screen.getByRole('button', { name: 'Middle' });

    middle.focus();

    await fireEvent.keyDown(dialog() as HTMLElement, { key: 'Tab' });

    expect(document.activeElement).toBe(middle);
  });

  it('leaves a forward Tab from the first control to the browser', async () => {
    const { panel, first } = await openDialogWithTwoButtons();

    first.focus();

    await fireEvent.keyDown(panel, { key: 'Tab' });

    expect(document.activeElement).toBe(first);
  });

  // ! With nothing focusable inside, there is no cycle — the trap has to bow out rather than reach
  // ! for a control that is not there.
  it('survives a Tab in a dialog with nothing focusable in it', async () => {
    await renderSuspended(UIDialog, {
      props: { open: true, title: TITLE },
      slots: { default: () => h('p', 'Nothing to focus here.') }
    });

    const panel = dialog() as HTMLElement;

    panel.focus();

    await fireEvent.keyDown(panel, { key: 'Tab' });

    expect(document.activeElement).toBe(panel);
  });

  // ! A disabled submit button is not a tab stop, so the trap has to read the controls per keypress
  // ! rather than caching them when the dialog opened.
  it('skips a disabled control when wrapping', async () => {
    await renderSuspended(UIDialog, {
      props: { open: true, title: TITLE },
      slots: {
        default: () => [
          h('button', { type: 'button' }, 'First'),
          h('button', { type: 'button' }, 'Middle'),
          h('button', { type: 'button', disabled: true }, 'Disabled')
        ]
      }
    });

    const middle = screen.getByRole('button', { name: 'Middle' });

    middle.focus();

    await fireEvent.keyDown(dialog() as HTMLElement, { key: 'Tab' });

    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'First' })
    );
  });
});
