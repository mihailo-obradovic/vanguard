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
