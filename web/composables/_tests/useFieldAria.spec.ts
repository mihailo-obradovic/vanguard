// @vitest-environment nuxt
import { describe, it, expect } from 'vitest';
import { ref } from 'vue';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent } from 'vue';

import { useFieldAria } from '../useFieldAria';

/**
 * `useId` only answers inside a component instance, so the composable is exercised through one.
 */
async function setup(errors: ReturnType<typeof ref<string[] | undefined>>) {
  let field!: ReturnType<typeof useFieldAria>;

  await mountSuspended(
    defineComponent({
      setup() {
        field = useFieldAria(errors);

        return () => null;
      }
    })
  );

  return field;
}

describe('useFieldAria', () => {
  it('pairs the label and the control on one generated id', async () => {
    const field = await setup(ref([]));

    expect(field.id).toBeTruthy();
    expect(field.errorId).toBe(`${field.id}-error`);
  });

  // ! Both fields have to be created inside ONE component: `useId` counts per mounted app, so
  // ! two separate mounts each restart at the same value and would pass this whatever it did.
  it('gives two fields on a page different ids, so their labels cannot cross', async () => {
    let first!: ReturnType<typeof useFieldAria>;
    let second!: ReturnType<typeof useFieldAria>;

    await mountSuspended(
      defineComponent({
        setup() {
          first = useFieldAria(ref([]));
          second = useFieldAria(ref([]));

          return () => null;
        }
      })
    );

    expect(first.id).not.toBe(second.id);
    expect(first.errorId).not.toBe(second.errorId);
  });

  it('leaves a valid control undescribed and unmarked', async () => {
    const field = await setup(ref([]));

    expect(field.invalid).toBe(false);
    expect(field.control['aria-invalid']).toBeUndefined();
    expect(field.control['aria-describedby']).toBeUndefined();
  });

  // ! Describing a control by an empty element tells a screen reader nothing, so the reference
  // ! appears only once there is a message to read.
  it('points the control at its message once there is one', async () => {
    const errors = ref<string[] | undefined>([]);
    const field = await setup(errors);

    errors.value = ['The email field is required.'];
    await nextTick();

    expect(field.invalid).toBe(true);
    expect(field.control['aria-invalid']).toBe(true);
    expect(field.control['aria-describedby']).toBe(field.errorId);
  });

  it('treats an absent error list as no errors', async () => {
    const field = await setup(ref(undefined));

    expect(field.errors).toEqual([]);
    expect(field.invalid).toBe(false);
  });

  it('accepts a getter as well as a ref', async () => {
    const messages = ref<string[]>([]);
    let field!: ReturnType<typeof useFieldAria>;

    await mountSuspended(
      defineComponent({
        setup() {
          field = useFieldAria(() => messages.value);

          return () => null;
        }
      })
    );

    expect(field.invalid).toBe(false);

    messages.value = ['Too short.'];
    await nextTick();

    expect(field.errors).toEqual(['Too short.']);
    expect(field.invalid).toBe(true);
  });
});
