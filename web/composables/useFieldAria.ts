import type { MaybeRefOrGetter } from 'vue';

/**
 * The `id` and ARIA wiring a `components/ui/field` composition needs.
 *
 * * `Field` is a layout group and `FieldLabel` a plain label — shadcn wires neither to its
 * * control, and its own docs write the pairing out at every call site. This is that pairing,
 * * and nothing else: the markup stays composed at the call site, which is the point of having
 * * no field wrapper (`catalyst/stacks/frontend/nuxt/ui/shadcn-vue/components.md`).
 *
 * * The `id` is generated rather than written, so no two forms on a page can collide and the
 * * `for`/`id` pair cannot drift apart. `aria-describedby` points at the error element only while
 * * it holds a message — describing a control by an empty element tells a screen reader nothing.
 */
export function useFieldAria(errors: MaybeRefOrGetter<string[] | undefined>) {
  const id = useId();
  const errorId = `${id}-error`;

  const list = computed(() => toValue(errors) ?? []);
  const invalid = computed(() => list.value.length > 0);

  return reactive({
    id,
    errorId,
    errors: list,
    invalid,
    // * Spread onto the control itself — `v-bind="field.control"`.
    control: computed(() => ({
      id,
      'aria-invalid': invalid.value || undefined,
      'aria-describedby': invalid.value ? errorId : undefined
    }))
  });
}
