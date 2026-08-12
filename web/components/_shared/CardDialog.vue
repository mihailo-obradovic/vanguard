<template>
  <v-dialog
    v-model="dialog"
    :width="width"
    :fullscreen="fullscreenOnMobile && xs"
    scrollable
    @after-leave="emit('after-leave')"
  >
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
</script>
