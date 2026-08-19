<template>
  <!-- * The role's own copy lives here rather than at each call site — every one of them resolved the same `users.roles.*` key. -->
  <u-badge
    :color="role === 'admin' ? 'error' : 'success'"
    :size="large ? 'lg' : 'md'"
    class="uppercase"
  >
    {{ $t(`users.roles.${role}`) }}
  </u-badge>
</template>

<script setup lang="ts">
import type { User } from '@/types/auth';

defineProps<{
  role: User['role'];
  // * The detail-view size: roomier than the one a table cell wants.
  large?: boolean;
}>();
</script>
