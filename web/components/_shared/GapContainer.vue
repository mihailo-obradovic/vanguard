<template>
  <component
    :is="dynamicComponent"
    :class="['d-flex', `ga-${gap}`, { 'flex-column': column }]"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import { VSheet, VCard } from 'vuetify/components';

// ! Stryker instruments this block with locally declared coverage helpers, and a compiler
// ! macro is hoisted out of setup() — referencing them there is a compile error, not a
// ! warning. The defaults inside go unmutated as a result (`catalyst/operations.md`).
// Stryker disable all
const props = withDefaults(
  defineProps<{
    // * HTML element or Vuetify component. Vuetify components need to be manually imported below.
    type?: string;
    column?: boolean;
    // * Vuetify measurement unit
    gap?: string;
  }>(),
  {
    type: 'div',
    column: false,
    gap: '4'
  }
);
// Stryker restore all

const dynamicComponent = computed(() => {
  switch (props.type) {
    case 'VSheet':
      return VSheet;
    case 'VCard':
      return VCard;
    default:
      return props.type;
  }
});
</script>
