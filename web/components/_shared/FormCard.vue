<template>
  <v-card :width="width" color="background" @keydown.enter="handleEnterKey">
    <v-card-title class="pa-4 pb-2">
      <slot name="title">{{ title }}</slot>
    </v-card-title>

    <v-card-text
      ref="body"
      :class="['px-4', 'py-2', { 'scroll-borders': isOverflowing }]"
    >
      <GapContainer ref="content" column>
        <slot name="default" />
      </GapContainer>
    </v-card-text>

    <v-card-actions class="pa-4 pt-2">
      <slot name="actions">
        <v-row no-gutters class="d-flex ga-4">
          <v-col>
            <v-btn block variant="outlined" @click="emit('cancel')">
              {{ $t('common.actions.cancel') }}
            </v-btn>
          </v-col>

          <v-col>
            <v-btn
              :disabled="confirmDisabled"
              :loading="loading"
              block
              :color="confirmColor"
              variant="flat"
              @click="emit('confirm')"
            >
              {{ $t('common.actions.confirm') }}
            </v-btn>
          </v-col>
        </v-row>
      </slot>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue';

// ! Stryker instruments this block with locally declared coverage helpers, and a compiler
// ! macro is hoisted out of setup() — referencing them there is a compile error, not a
// ! warning. The defaults inside go unmutated as a result (`catalyst/operations.md`).
// Stryker disable all
const props = withDefaults(
  defineProps<{
    title: string;
    // * Left unset inside a dialog, which sizes the card itself; a standalone page card sets its own
    width?: string;
    confirmDisabled?: boolean;
    loading?: boolean;
    confirmOnEnter?: boolean;
    confirmColor?: string;
  }>(),
  {
    width: undefined,
    confirmDisabled: false,
    loading: false,
    confirmOnEnter: true,
    confirmColor: 'primary'
  }
);

const emit = defineEmits<{
  cancel: [];
  confirm: [];
}>();
// Stryker restore all

const body = useTemplateRef<ComponentPublicInstance>('body');
const content = useTemplateRef<ComponentPublicInstance>('content');

const isOverflowing = ref(false);

// * Show the body's scroll borders only while its content actually overflows; observing both elements catches window resizes and slot content changes
useResizeObserver(
  computed(() => [body.value?.$el, content.value?.$el].filter(Boolean)),
  () => {
    const el = body.value?.$el as HTMLElement | undefined;
    isOverflowing.value = !!el && el.scrollHeight > el.clientHeight;
  }
);

const handleEnterKey = useConfirmOnEnter(
  () => emit('confirm'),
  () => props.confirmOnEnter && !props.confirmDisabled && !props.loading
);
</script>

<style scoped>
.scroll-borders {
  border-top: 1px solid rgba(var(--v-theme-secondary), 0.25);
  border-bottom: 1px solid rgba(var(--v-theme-secondary), 0.25);
}
</style>
