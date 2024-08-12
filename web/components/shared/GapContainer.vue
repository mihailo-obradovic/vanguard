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
  column: {
    type: Boolean,
    default: false
  },

  gap: {
    type: String,
    default: '2'
  },

  type: {
    type: String,
    default: 'div' // 'div' | 'v-sheet'
  }
});
</script>
