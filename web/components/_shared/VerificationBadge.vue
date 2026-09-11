<template>
  <!-- * The wording is the caller's — a table column says "Yes"/"No" where a detail view says "Verified"/"Not verified" — so only the state and its colour live here. -->
  <Badge
    :variant="verified ? 'success' : 'warning'"
    :class="large && 'px-3 py-1.5 font-semibold'"
  >
    <slot />
  </Badge>
</template>

<script setup lang="ts">
import { Badge } from '@/components/ui/badge';

defineProps<{
  verified: boolean;
  // * The detail-view size: roomier and bolder than the one a table cell wants.
  large?: boolean;
}>();
</script>
