<template>
  <span class="role-badge" :class="[role, { large }]">
    <!-- * The two roles are the whole set, so the badge reserves the wider of them itself. It sits in an auto-layout table cell, where a promotion or demotion re-widths the column and shifts every column beside it — and in sr-Cyrl the swing is Корисник to Администратор. -->
    <UIReservedLabel
      :variants="{
        user: $t('users.roles.user'),
        admin: $t('users.roles.admin')
      }"
      :active="role"
    />
  </span>
</template>

<script setup lang="ts">
import type { User } from '@/types/auth';

defineProps<{
  role: User['role'];
  // * The detail-view size: roomier and bolder than the one a table cell wants.
  large?: boolean;
}>();
</script>

<style scoped>
/* * The role's own copy lives here rather than at each call site — every one of them resolved the same `users.roles.*` key. */
.role-badge {
  padding: 4px 8px;
  border-radius: var(--radius);
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
}

.role-badge.large {
  padding: 6px 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.role-badge.admin {
  background-color: var(--color-danger);
  color: var(--color-on-brand);
}

.role-badge.user {
  background-color: var(--color-success);
  color: var(--color-on-brand);
}
</style>
