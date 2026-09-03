// @vitest-environment nuxt
import { describe, it, expect, afterEach, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { renderSuspended } from '@nuxt/test-utils/runtime';
import { screen, fireEvent, cleanup } from '@testing-library/vue';

import UIField from '../UIField.vue';

/** The control a user reaches through the field's own label. */
function controlLabelled(label: string) {
  return screen.getByLabelText(label);
}

/** What a screen reader is told the control is described by, resolved to its text. */
function descriptionOf(control: HTMLElement) {
  const id = control.getAttribute('aria-describedby');

  if (!id) {
    return null;
  }

  return document.getElementById(id)?.textContent?.trim() ?? null;
}

describe('UIField', () => {
  afterEach(() => {
    cleanup();
  });

  // ! The pairing this proves — label `for` ↔ control `id` — was hand-written per page before, and
  // ! is why two pages once needed `gql-name` to avoid colliding with `name`.
  it('labels its control, so the label reaches the input', async () => {
    await renderSuspended(UIField, {
      props: { label: 'Email', modelValue: '' }
    });

    expect(controlLabelled('Email').tagName).toBe('INPUT');
  });

  // ! Two fields of the same form, in one app: rendering them separately would give each its own
  // ! id sequence and pass no matter what the component does.
  it('generates a distinct id per field, so two fields on one form cannot collide', async () => {
    const form = defineComponent({
      setup() {
        return () => [
          h(UIField, { label: 'Email', modelValue: '' }),
          h(UIField, { label: 'Name', modelValue: '' })
        ];
      }
    });

    await renderSuspended(form);

    expect(controlLabelled('Email').id).not.toBe(controlLabelled('Name').id);
    expect(controlLabelled('Email').id).not.toBe('');
  });

  it('shows the first validation message', async () => {
    await renderSuspended(UIField, {
      props: {
        label: 'Email',
        modelValue: '',
        errors: ['The email field is required.']
      }
    });

    expect(screen.getByText('The email field is required.')).toBeTruthy();
  });

  // * Regle can report several failures at once; the field shows one line so the layout never grows.
  it('shows only the first message when several failed at once', async () => {
    await renderSuspended(UIField, {
      props: {
        label: 'Email',
        modelValue: '',
        errors: [
          'The email field is required.',
          'The email field must be valid.'
        ]
      }
    });

    expect(screen.queryByText('The email field must be valid.')).toBeNull();
  });

  it('marks the control invalid and describes it by the message', async () => {
    await renderSuspended(UIField, {
      props: {
        label: 'Email',
        modelValue: '',
        errors: ['The email field is required.']
      }
    });

    const control = controlLabelled('Email');

    expect(control.getAttribute('aria-invalid')).toBe('true');
    expect(descriptionOf(control)).toBe('The email field is required.');
  });

  // ! Describing an input by an empty paragraph announces nothing while claiming a description
  // ! exists, so the wiring goes away with the message rather than pointing at blank text.
  it('claims neither invalidity nor a description while the field is valid', async () => {
    await renderSuspended(UIField, {
      props: { label: 'Email', modelValue: '', errors: [] }
    });

    const control = controlLabelled('Email');

    expect(control.getAttribute('aria-invalid')).toBeNull();
    expect(descriptionOf(control)).toBeNull();
  });

  it('reports what the user types back to the form model', async () => {
    // * The model is optional on the component, so its update payload is `string | undefined`.
    const onUpdate = vi.fn<(value: string | undefined) => void>();

    await renderSuspended(UIField, {
      props: {
        label: 'Email',
        modelValue: '',
        'onUpdate:modelValue': onUpdate
      }
    });

    await fireEvent.update(controlLabelled('Email'), 'user@example.com');

    expect(onUpdate).toHaveBeenCalledWith('user@example.com');
  });

  // ! Attributes land on the control rather than the wrapper — a caller writing `type="password"`
  // ! or `:disabled` means them for the input, and on the wrapper they would do nothing at all.
  it('forwards native attributes to the control, not the wrapper', async () => {
    await renderSuspended(UIField, {
      props: { label: 'Password', modelValue: '' },
      attrs: { type: 'password', required: true, disabled: true }
    });

    // * A password input has no accessible role, so it is reached through its label rather than a role query.
    const control = controlLabelled('Password') as HTMLInputElement;

    expect(control.type).toBe('password');
    expect(control.required).toBe(true);
    expect(control.disabled).toBe(true);
  });

  // * The role select is the second control shape the pages need; it takes the same label and id
  // * wiring through the slot instead of the field rendering an input of its own.
  it('labels a control supplied through the slot the same way', async () => {
    await renderSuspended(UIField, {
      props: { label: 'Role' },
      slots: {
        default: ({ controlId }: { controlId: string }) =>
          h('select', { id: controlId }, [
            h('option', { value: 'user' }, 'User')
          ])
      }
    });

    expect(controlLabelled('Role').tagName).toBe('SELECT');
  });
});
