<template>
  <div class="w-100 h-100 d-flex justify-center align-center">
    <v-progress-circular :indeterminate="isLoading" color="primary" />
  </div>
</template>

<script setup>
const isLoading = defineModel({
  type: Boolean,
  required: true
});
</script>
