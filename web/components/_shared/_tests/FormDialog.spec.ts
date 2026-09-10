// @vitest-environment nuxt
import { describe, it, expect, afterEach } from 'vitest';
import { renderSuspended } from '@nuxt/test-utils/runtime';
import { screen, fireEvent, cleanup, waitFor } from '@testing-library/vue';
import { defineComponent, ref } from 'vue';

import FormDialog from '../FormDialog.vue';

type FormDialogProps = InstanceType<typeof FormDialog>['$props'];

function renderDialog(
  props: Partial<FormDialogProps> = {},
  slots: Record<string, string> = {}
) {
  return renderSuspended(FormDialog, {
    props: { modelValue: true, title: 'Edit user', ...props },
    slots
  });
}

function button(name: string) {
  return screen.getByRole('button', { name }) as HTMLButtonElement;
}

/** An owner holding the open state, the way every call site binds this dialog. */
const AnOwnedDialog = defineComponent({
  components: { FormDialog },
  setup() {
    return { open: ref(true) };
  },
  template: `
    <FormDialog v-model="open" title="Edit user" @cancel="open = false" />
  `
});

describe('FormDialog', () => {
  afterEach(() => {
    cleanup();
    // ! The dialog teleports to body, outside the container `cleanup` owns.
    document.body.innerHTML = '';
  });

  it('shows the content it was handed', async () => {
    await renderDialog({}, { default: '<p>Some field</p>' });

    expect(screen.getByText('Some field')).toBeTruthy();
  });

  it('carries the dialog’s cancel and confirm out to its owner', async () => {
    const { emitted } = await renderDialog();

    await fireEvent.click(button('Cancel'));
    await fireEvent.click(button('Confirm'));

    expect(emitted().cancel).toHaveLength(1);
    expect(emitted().confirm).toHaveLength(1);
  });

  it('disables confirmation when told to', async () => {
    const { emitted } = await renderDialog({ confirmDisabled: true });

    expect(button('Confirm').disabled).toBe(true);
    expect(emitted().confirm).toBeUndefined();
  });

  it('disables confirmation while loading', async () => {
    await renderDialog({ loading: true });

    expect(button('Confirm').disabled).toBe(true);
  });

  it('leaves the card’s own title and buttons in place when no slots are given', async () => {
    await renderDialog();

    expect(screen.getByText('Edit user')).toBeTruthy();
    expect(button('Cancel')).toBeTruthy();
    expect(button('Confirm')).toBeTruthy();
  });

  it('lets an owner replace the title and the button row', async () => {
    await renderDialog(
      {},
      { title: '<span>Step two</span>', actions: '<button>Close</button>' }
    );

    expect(screen.getByText('Step two')).toBeTruthy();
    expect(button('Close')).toBeTruthy();
    expect(screen.queryByText('Edit user')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Confirm' })).toBeNull();
  });

  // * Confirms on Enter from a plain field but not from the cancel button itself — otherwise
  // * pressing Enter while focus sits on Cancel would fire both.
  it('confirms on Enter, but not from a control that handles Enter itself', async () => {
    const { emitted } = await renderDialog({}, { default: '<input />' });

    await fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });

    await waitFor(() => expect(emitted().confirm).toHaveLength(1));

    await fireEvent.keyDown(button('Cancel'), { key: 'Enter' });

    expect(emitted().confirm).toHaveLength(1);
  });

  // ! Cancelling does not close the dialog by itself — the owner holds the model. This is the
  // ! arrangement every call site uses, and the reason the base leaves closing to the owner.
  it('leaves the screen once its owner clears the model', async () => {
    await renderSuspended(AnOwnedDialog);

    await fireEvent.click(button('Cancel'));

    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull()
    );
  });
});

// ! `after-leave` has no case here, and cannot have one: Reka UI's Presence utility drives the
// ! close transition off real `animationend` events dispatched by the browser's CSS animation
// ! engine, and happy-dom has none — the dialog closes, but the animation (and so the event) never
// ! fires. The wiring is traced to source (`decisions/014_ui_shadcn-dialog-auth-composition.md`);
// ! the re-emit itself stays on the live browser walk (`catalyst/operations.md`).
