// @vitest-environment nuxt
import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderSuspended } from '@nuxt/test-utils/runtime';
import { screen, fireEvent, cleanup, waitFor } from '@testing-library/vue';
import { createVuetify } from 'vuetify';
import { defineComponent, ref } from 'vue';

import CardDialog from '../CardDialog.vue';

// ! happy-dom has no `visualViewport`, and Vuetify's overlay positioning reaches for it as a bare
// ! global — optional chaining does not save an *undeclared* name from a ReferenceError.
vi.stubGlobal('visualViewport', null);

type CardDialogProps = InstanceType<typeof CardDialog>['$props'];

/** Vuetify needs supplying by hand — `renderSuspended` does not run the Nuxt plugin that installs it. */
function renderDialog(
  props: Partial<CardDialogProps> = {},
  slots: Record<string, string> = {}
) {
  return renderSuspended(CardDialog, {
    props: { modelValue: true, title: 'Edit user', ...props },
    slots,
    global: { plugins: [createVuetify()] }
  });
}

function button(name: string) {
  return screen.getByRole('button', { name });
}

/** An owner holding the open state, the way every call site binds this dialog. */
const AnOwnedDialog = defineComponent({
  components: { CardDialog },
  setup() {
    return { open: ref(true) };
  },
  template: `
    <CardDialog v-model="open" title="Edit user" @cancel="open = false" />
  `
});

describe('CardDialog', () => {
  afterEach(() => {
    cleanup();
    // ! The dialog teleports to body, outside the container `cleanup` owns.
    document.body.innerHTML = '';
  });

  it('shows the content it was handed', async () => {
    await renderDialog({}, { default: '<p>Some field</p>' });

    expect(screen.getByText('Some field')).toBeTruthy();
  });

  it('carries the card’s cancel and confirm out to its owner', async () => {
    const { emitted } = await renderDialog();

    await fireEvent.click(button('Cancel'));
    await fireEvent.click(button('Confirm'));

    expect(emitted().cancel).toHaveLength(1);
    expect(emitted().confirm).toHaveLength(1);
  });

  it('passes a disabled confirmation down to the card', async () => {
    const { emitted } = await renderDialog({ confirmDisabled: true });

    await fireEvent.click(button('Confirm'));

    expect(emitted().confirm).toBeUndefined();
  });

  // ! The `v-if="$slots.…"` guards on the forwarded slots are defensive, not load-bearing: Vue
  // ! falls back when a forwarded slot renders nothing, so dropping them changes nothing here.
  // ! This case pins what the user sees — an owner that supplies no slots still gets a titled
  // ! dialog with both buttons — rather than the guard itself. It carries the plain title too,
  // ! which is why there is no separate case for it.
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

  // ! Cancelling does not close the dialog by itself — the owner holds the model. This is the
  // ! arrangement every call site uses, and the reason `handleCancel` clears the model rather
  // ! than the base doing it.
  it('leaves the screen once its owner clears the model', async () => {
    await renderSuspended(AnOwnedDialog, {
      global: { plugins: [createVuetify()] }
    });

    await fireEvent.click(button('Cancel'));

    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull()
    );
  });
});

// ! `after-leave` has no case here, and cannot have one: `v-dialog` fades through
// ! VDialogTransition, whose leave hook measures the activator and drives the fade with the Web
// ! Animations API. happy-dom has no `Element.prototype.animate` and no layout, so the hook never
// ! reaches its `done()` callback and Vue never emits `after-leave` — the dialog closes, but
// ! silently. The re-emit stays on the live browser walk (`catalyst/operations.md`).
