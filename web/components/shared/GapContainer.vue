<template>
  <component
    :is="dynamicComponent"
    :class="['d-flex', `ga-${gap}`, { 'flex-column': column }]"
  >
    <slot />
  </component>
</template>

<script setup>
import { VSheet, VCard } from 'vuetify/components';

const props = defineProps({
  type: {
    type: String, // HTML element or Vuetify component. Vuetify components need to be manually imported below.
    default: 'div'
  },

  column: {
    type: Boolean,
    default: false
  },

  gap: {
    type: String, // Vuetify measurement unit
    default: '4'
  }
});

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
