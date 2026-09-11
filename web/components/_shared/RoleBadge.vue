<template>
  <!-- * The role's own copy lives here rather than at each call site — every one of them resolved the same `users.roles.*` key. -->
  <Badge
    :variant="role === 'admin' ? 'destructive' : 'success'"
    :class="['uppercase', large && 'px-3 py-1.5 font-semibold tracking-wide']"
  >
    <!-- * The two roles are the whole set, so the badge reserves the wider of them itself. It sits in an auto-layout table cell, where a promotion or demotion re-widths the column and shifts every column beside it — and in sr-Cyrl the swing is Корисник to Администратор. -->
    <UIReservedLabel
      :variants="{
        user: $t('users.roles.user'),
        admin: $t('users.roles.admin')
      }"
      :active="role"
    />
  </Badge>
</template>

<script setup lang="ts">
import { Badge } from '@/components/ui/badge';

import type { User } from '@/types/auth';

defineProps<{
  role: User['role'];
  // * The detail-view size: roomier and bolder than the one a table cell wants.
  large?: boolean;
}>();
</script>
