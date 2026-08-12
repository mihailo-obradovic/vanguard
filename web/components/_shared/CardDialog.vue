<template>
  <v-dialog
    v-model="dialog"
    :width="width"
    :fullscreen="fullscreenOnMobile && xs"
    scrollable
  >
    <v-card color="background">
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
                Cancel
              </v-btn>
            </v-col>

            <v-col>
              <v-btn
                :disabled="confirmDisabled"
                :loading="loading"
                block
                color="primary"
                variant="flat"
                @click="emit('confirm')"
              >
                Confirm
              </v-btn>
            </v-col>
          </v-row>
        </slot>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue';
import { useDisplay } from 'vuetify';

withDefaults(
  defineProps<{
    title: string;
    width?: string;
    confirmDisabled?: boolean;
    loading?: boolean;
    fullscreenOnMobile?: boolean;
  }>(),
  {
    width: '450px',
    confirmDisabled: false,
    loading: false,
    fullscreenOnMobile: true
  }
);

// * xs (<600px) rather than Vuetify's default mobile breakpoint, which flags anything below 1280px
const { xs } = useDisplay();

const dialog = defineModel<boolean>({ required: true });

const emit = defineEmits<{
  cancel: [];
  confirm: [];
}>();

const body = useTemplateRef<ComponentPublicInstance>('body');
const content = useTemplateRef<ComponentPublicInstance>('content');

const isOverflowing = ref(false);

// * Show the body's scroll borders only while its content actually overflows; observing both elements catches window resizes and slot content changes
useResizeObserver(
  computed(() =>
    [body.value?.$el, content.value?.$el].filter(Boolean)
  ),
  () => {
    const el = body.value?.$el as HTMLElement | undefined;
    isOverflowing.value = !!el && el.scrollHeight > el.clientHeight;
  }
);
</script>

<style scoped>
.scroll-borders {
  border-top: 1px solid rgba(var(--v-theme-secondary), 0.25);
  border-bottom: 1px solid rgba(var(--v-theme-secondary), 0.25);
}
</style>
