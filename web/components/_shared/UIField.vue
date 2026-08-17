<template>
  <div class="ui-field">
    <label :for="controlId" class="ui-field-label">{{ label }}</label>

    <!-- * Slot prop names stay camelCase: unlike props, they are object keys the compiler emits verbatim, so a kebab-case name here would not destructure as `controlId`. -->
    <slot :controlId="controlId" :describedBy="describedBy">
      <input
        v-bind="$attrs"
        :id="controlId"
        v-model="model"
        class="ui-field-control"
        :aria-describedby="describedBy"
        :aria-invalid="invalid || undefined"
      />
    </slot>

    <p :id="errorId" class="ui-field-error">{{ errors?.[0] ?? '' }}</p>
  </div>
</template>

<script setup lang="ts">
// * Attributes land on the control, not on the wrapper: a caller writing `type`, `required` or `:disabled` means them for the input.
// ! The macro is hoisted out of `setup()`, so a mutant placed inside it references Stryker's
// ! setup-local coverage helpers and fails `@vue/compiler-sfc` outright — see `catalyst/operations.md`.
// Stryker disable all
defineOptions({ inheritAttrs: false });
// Stryker restore all

const props = defineProps<{
  // * The field label — the string above the control. The name a validation message interpolates is a separate catalog entry and never passes through here (`utils/labeledRules.ts`).
  label: string;
  // * Regle's `$errors` for this field, already `string[]`. Absent for a field with no rules of its own.
  errors?: string[];
}>();

const model = defineModel<string>();

// * Generated rather than passed, so no two forms can collide on an `id` and no caller has to remember the `for`/`id` pair at all.
const controlId = useId();
const errorId = `${controlId}-error`;

const invalid = computed(() => (props.errors?.length ?? 0) > 0);

// * Only points at the error paragraph while it holds a message — describing an input by an empty element tells a screen reader nothing.
const describedBy = computed(() => (invalid.value ? errorId : undefined));
</script>

<style scoped>
.ui-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ui-field-label {
  color: #495057;
  font-weight: 500;
  font-size: 14px;
}

/* * Deep, because a control passed through the slot is compiled in the caller's scope and carries the caller's scope id — the default input and a slotted `<select>` have to be reachable by the same rule. */
.ui-field :deep(.ui-field-control) {
  padding: 8px 16px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.25s ease;
  background-color: white;
}

.ui-field :deep(.ui-field-control:focus) {
  outline: none;
  border-color: rgb(0, 102, 255);
  box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
}

.ui-field :deep(.ui-field-control:disabled) {
  background-color: #f8f9fa;
  cursor: not-allowed;
  opacity: 0.7;
}

/* * Always occupies one line so messages appearing/disappearing don't shift the layout. */
.ui-field-error {
  color: #dc3545;
  font-size: 14px;
  line-height: 1.3;
  min-height: 18px;
  margin: 0;
}
</style>
