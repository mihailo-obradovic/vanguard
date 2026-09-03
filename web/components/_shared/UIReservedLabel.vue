<template>
  <span class="ui-reserved-label">
    <!-- * Every variant is laid into the same grid cell, so the widest and tallest one sizes the box and the shown text paints over it. Hidden from assistive tech: these are a measuring device, and reading all of a control's states aloud is worse than the jump they prevent. -->
    <span
      v-for="(text, key) in variants"
      :key="key"
      class="ui-reserved-label-ghost"
      aria-hidden="true"
      >{{ text }}</span
    >

    <span class="ui-reserved-label-shown">{{ variants[active] }}</span>
  </span>
</template>

<script setup lang="ts" generic="TVariant extends string">
defineProps<{
  // * The complete set of strings this label can hold, keyed by the state that shows each.
  variants: Record<TVariant, string>;
  active: TVariant;
}>();
</script>

<style scoped>
/*
 * ! The shown text is read out of `variants` rather than passed alongside it. That is the whole
 * point: a caller cannot show a string the reservation did not measure, so the box can never stop
 * covering the thing it reserves for (`catalyst/stacks/frontend/_common/layout-stability.md`).
 */
.ui-reserved-label {
  display: inline-grid;
  /* * One cell. Every child is placed in it, so the box is the widest and tallest variant at whatever width it is rendered — no pixel constant to maintain, and it follows a copy edit or a locale switch on its own. */
  grid-template-areas: 'label';
}

.ui-reserved-label-ghost,
.ui-reserved-label-shown {
  grid-area: label;
}

.ui-reserved-label-ghost {
  /* * `visibility: hidden` still reserves space; `display: none` would not. */
  visibility: hidden;
}
</style>
