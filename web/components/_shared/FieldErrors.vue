<template>
  <p class="field-error">
    {{ errors[0] ?? '' }}
  </p>
</template>

<script setup lang="ts">
defineProps<{ errors: string[] }>();
</script>

<style scoped>
/* Always occupies one line so messages appearing/disappearing don't shift
   the layout. */
.field-error {
  color: #dc3545;
  font-size: 14px;
  line-height: 1.3;
  min-height: 18px;
  margin: 0;
}
</style>
