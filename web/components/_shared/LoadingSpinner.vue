<template>
  <!-- * `fillHeight` spans the space left in the parent rather than a measured slice of the viewport: it needs a parent that is a bounded flex column, which is what the layout's page container is. -->
  <div
    class="d-flex justify-center align-center pa-4 w-100"
    :class="{ 'loading-spinner-fill': fillHeight }"
  >
    <v-progress-circular
      :indeterminate="isLoading"
      color="primary"
      class="z-index-top"
    />
  </div>
</template>

<script setup lang="ts">
// ! Stryker instruments this block with locally declared coverage helpers, and a compiler
// ! macro is hoisted out of setup() — referencing them there is a compile error, not a
// ! warning. The defaults inside go unmutated as a result (`catalyst/operations.md`).
// Stryker disable all
defineProps<{
  fillHeight?: boolean;
}>();

const isLoading = defineModel<boolean>({ required: true });
// Stryker restore all
</script>

<style scoped>
/* ! `min-height: 0` is the part that matters: a flex child's default `min-height: auto` refuses to shrink below its content, so without it this would grow its parent rather than fill it. */
.loading-spinner-fill {
  flex: 1 1 auto;
  min-height: 0;
}
</style>
