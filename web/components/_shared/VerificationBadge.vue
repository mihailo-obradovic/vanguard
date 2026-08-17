<template>
  <span class="verification-badge" :class="{ verified, large }">
    <slot />
  </span>
</template>

<script setup lang="ts">
defineProps<{
  verified: boolean;
  // * The detail-view size: roomier and bolder than the one a table cell wants.
  large?: boolean;
}>();
</script>

<style scoped>
/* * The wording is the caller's — a table column says "Yes"/"No" where a detail view says "Verified"/"Not verified" — so only the state and its colour live here. */
.verification-badge {
  padding: 4px 8px;
  border-radius: var(--radius);
  font-size: 12px;
  font-weight: 500;
}

.verification-badge.large {
  padding: 6px 12px;
  font-weight: 600;
}

.verification-badge.verified {
  background-color: var(--color-success);
  color: var(--color-on-brand);
}

.verification-badge:not(.verified) {
  background-color: var(--color-warning);
  color: var(--color-on-warning);
}
</style>
