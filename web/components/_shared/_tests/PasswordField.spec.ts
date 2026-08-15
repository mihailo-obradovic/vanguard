// @vitest-environment nuxt
import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderSuspended } from '@nuxt/test-utils/runtime';
import { screen, fireEvent, cleanup } from '@testing-library/vue';
import { createVuetify } from 'vuetify';
import { defineComponent, ref } from 'vue';

import PasswordField from '../PasswordField.vue';

// ! happy-dom has no `visualViewport`, and Vuetify's overlay positioning reaches for it as a bare
// ! global — optional chaining does not save an *undeclared* name from a ReferenceError.
vi.stubGlobal('visualViewport', null);

/** Vuetify needs supplying by hand — `renderSuspended` does not run the Nuxt plugin that installs it. */
const vuetify = () => ({ global: { plugins: [createVuetify()] } });

function fields() {
  return Array.from(document.querySelectorAll('input'));
}

/**
 * A password and its confirmation, sharing one `visible` model — the arrangement both
 * `UserFormDialog` and `UserCard` use, and the reason the second model exists.
 */
const APairOfFields = defineComponent({
  components: { PasswordField },
  setup() {
    return { visible: ref(false), password: ref(''), confirmation: ref('') };
  },
  template: `
    <div>
      <PasswordField v-model="password" v-model:visible="visible" />
      <PasswordField v-model="confirmation" v-model:visible="visible" />
    </div>
  `
});

describe('PasswordField', () => {
  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  it('keeps the password masked until it is asked to show it', async () => {
    await renderSuspended(PasswordField, {
      props: { modelValue: 'hunter2' },
      ...vuetify()
    });

    expect(fields()[0]!.type).toBe('password');
    expect(screen.getByRole('button', { name: 'Show password' })).toBeTruthy();
  });

  it('reveals the password, and offers to hide it again', async () => {
    await renderSuspended(PasswordField, {
      props: { modelValue: 'hunter2' },
      ...vuetify()
    });

    await fireEvent.click(
      screen.getByRole('button', { name: 'Show password' })
    );

    expect(fields()[0]!.type).toBe('text');
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeTruthy();
  });

  it('hides it again on a second press', async () => {
    await renderSuspended(PasswordField, {
      props: { modelValue: 'hunter2' },
      ...vuetify()
    });

    await fireEvent.click(
      screen.getByRole('button', { name: 'Show password' })
    );
    await fireEvent.click(
      screen.getByRole('button', { name: 'Hide password' })
    );

    expect(fields()[0]!.type).toBe('password');
  });

  // ! The whole point of the second model: revealing a password reveals its confirmation too, so
  // ! the user can compare them without pressing two toggles.
  it('reveals a password and its confirmation together', async () => {
    await renderSuspended(APairOfFields, vuetify());

    await fireEvent.click(
      screen.getAllByRole('button', { name: 'Show password' })[0]!
    );

    expect(fields().map((field) => field.type)).toEqual(['text', 'text']);
  });

  it('reports what the user types', async () => {
    const { emitted } = await renderSuspended(PasswordField, {
      props: { modelValue: '' },
      ...vuetify()
    });

    await fireEvent.update(fields()[0]!, 'hunter2');

    expect(emitted()['update:modelValue']).toContainEqual(['hunter2']);
  });
});
