<template>
  <v-dialog
    v-model="dialog"
    :width="width"
    :fullscreen="fullscreenOnMobile && xs"
    scrollable
    @after-leave="emit('after-leave')"
  >
    <!-- ! Each prop and event is forwarded by hand rather than through `v-bind="$attrs"` and a slot loop. The loop is about eighteen lines shorter and was considered and rejected: attrs are untyped, so `title`, `loading`, `confirmDisabled`, `confirmOnEnter` and `confirmColor` would stop being checked at the six call sites, and the spec cases that sabotage-prove each forward would have nothing left to assert. The forwarding is this component's contract, not plumbing to be minimized. -->
    <FormCard
      :title="title"
      :confirm-disabled="confirmDisabled"
      :loading="loading"
      :confirm-on-enter="confirmOnEnter"
      :confirm-color="confirmColor"
      @cancel="emit('cancel')"
      @confirm="emit('confirm')"
    >
      <!-- * Forwarded only when the parent supplies them, so FormCard's own fallbacks still apply -->
      <template v-if="$slots.title" #title>
        <slot name="title" />
      </template>

      <slot name="default" />

      <template v-if="$slots.actions" #actions>
        <slot name="actions" />
      </template>
    </FormCard>
  </v-dialog>
</template>

<script setup lang="ts">
import { useDisplay } from 'vuetify';

// ! Stryker instruments this block with locally declared coverage helpers, and a compiler
// ! macro is hoisted out of setup() — referencing them there is a compile error, not a
// ! warning. The defaults inside go unmutated as a result (`catalyst/operations.md`).
// Stryker disable all
withDefaults(
  defineProps<{
    title: string;
    width?: string;
    confirmDisabled?: boolean;
    loading?: boolean;
    fullscreenOnMobile?: boolean;
    confirmOnEnter?: boolean;
    confirmColor?: string;
  }>(),
  {
    width: '450px',
    confirmDisabled: false,
    loading: false,
    fullscreenOnMobile: true,
    confirmOnEnter: true,
    confirmColor: 'primary'
  }
);

// * xs (<600px) rather than Vuetify's default mobile breakpoint, which flags anything below 1280px
const { xs } = useDisplay();

const dialog = defineModel<boolean>({ required: true });

const emit = defineEmits<{
  cancel: [];
  confirm: [];
  // * Fires once the close transition has finished — the safe moment for owners to clear state the dialog was rendering
  'after-leave': [];
}>();
// Stryker restore all
</script>
