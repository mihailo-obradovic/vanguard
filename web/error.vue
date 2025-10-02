<template>
  <NuxtLoadingIndicator />

  <NuxtLayout>
    {{ error }}
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app';

defineProps({
  error: {
    type: Object as PropType<NuxtError>,
    required: true
  }
});
</script>
