<template>
  <div
    ref="wrapper"
    class="d-flex justify-center align-center pa-4 w-100"
    :style="wrapperStyle"
  >
    <v-progress-circular
      :indeterminate="isLoading"
      color="primary"
      class="z-index-top"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  fillHeight?: boolean;
}>();

const isLoading = defineModel<boolean>({ required: true });

const wrapper = useTemplateRef('wrapper');

// * Where the wrapper starts in the viewport, so fillHeight spans exactly the space below it (app bar and siblings included)
const { top } = useElementBounding(wrapper, { windowScroll: false });

const wrapperStyle = computed(() =>
  props.fillHeight
    ? { height: `calc(100dvh - ${top.value}px - var(--v-layout-bottom, 0px))` }
    : undefined
);
</script>
