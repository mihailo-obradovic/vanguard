<template>
  <!-- * The wording is the caller's — a table column says "Yes"/"No" where a detail view says "Verified"/"Not verified" — so only the state and its colour live here. -->
  <u-badge
    :color="verified ? 'success' : 'warning'"
    :size="large ? 'lg' : 'md'"
  >
    <slot />
  </u-badge>
</template>

<script setup lang="ts">
defineProps<{
  verified: boolean;
  // * The detail-view size: roomier than the one a table cell wants.
  large?: boolean;
}>();
</script>
