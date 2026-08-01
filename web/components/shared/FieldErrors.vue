<template>
  <p v-for="error in errors" :key="error" class="field-error">
    {{ error }}
  </p>
</template>

<script setup lang="ts">
defineProps<{ errors: string[] }>();
</script>

<style scoped>
.field-error {
  color: #dc3545;
  font-size: 14px;
  margin: 4px 0 0;
}
</style>
