<template>
  <v-card :width="width" color="background" @keydown.enter="handleEnterKey">
    <v-card-title class="pa-4 pb-2">
      <slot name="title">{{ title }}</slot>
    </v-card-title>

    <v-card-text
      ref="body"
      :class="['px-4', 'py-2', edgeClasses]"
      @scroll.passive="measure"
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

const edges = ref({ top: false, bottom: false, left: false, right: false });

const edgeClasses = computed(() => ({
  'edge-top': edges.value.top,
  'edge-bottom': edges.value.bottom
}));

// ! Per edge, never one boolean for the region: at the top of the scroll a top border claims content above that is not there, and at the end a bottom border claims more below. The arithmetic and its 1px tolerance live in `utils/scrollEdges.ts`, unit-tested there.
function measure() {
  const el = body.value?.$el as HTMLElement | undefined;

  if (el) {
    edges.value = scrollEdges(el);
  }
}

// * Observing both elements catches a window resize and slot content growing inside a body that never changed size; the scroll listener above is the third source, and the edge state changes on every scroll.
useResizeObserver(
  computed(() => [body.value?.$el, content.value?.$el].filter(Boolean)),
  measure
);

onMounted(measure);

const handleEnterKey = useConfirmOnEnter(
  () => emit('confirm'),
  () => props.confirmOnEnter && !props.confirmDisabled && !props.loading
);
</script>

<style scoped>
/*
 * ! The 1px is reserved on both edges and only its colour changes; toggling border-width would move
 * the body by a pixel each time an edge appeared. The old colour — secondary at 25% — painted
 * 1.51:1 on the light ground and 1.11:1 on the dark one, well under the 3:1 this border owes as an
 * indicator rather than a divider (WCAG 1.4.11).
 */
.v-card-text {
  border-top: 1px solid transparent;
  border-bottom: 1px solid transparent;
}

.edge-top {
  border-top-color: rgb(var(--v-theme-scroll-edge));
}

.edge-bottom {
  border-bottom-color: rgb(var(--v-theme-scroll-edge));
}
</style>
