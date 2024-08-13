<template>
  <component
    :is="type"
    :class="['d-flex', `ga-${gap}`, { 'flex-column': column }]"
  >
    <slot />
  </component>
</template>

<script setup>
defineProps({
  type: {
    type: String, // 'div' | 'v-sheet' | something else
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
</script>
