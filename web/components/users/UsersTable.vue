<template>
  <GapContainer
    ref="root"
    type="VSheet"
    elevation="1"
    class="rounded-lg position-relative"
  >
    <!-- * Background refetch (isLoading upstream): the stale rows stay visible, this bar is the only affordance. Absolute, so appearing costs no layout shift. -->
    <v-progress-linear
      v-if="refreshing"
      indeterminate
      absolute
      color="primary"
      rounded
    />

    <v-table fixed-header class="w-100 users-table">
      <thead>
        <tr>
          <th class="font-weight-bold">{{ $t('users.columns.id') }}</th>
          <th class="font-weight-bold">{{ $t('users.columns.name') }}</th>
          <th class="font-weight-bold">{{ $t('users.columns.email') }}</th>
          <th class="font-weight-bold">{{ $t('users.columns.role') }}</th>
          <th class="font-weight-bold text-right">
            {{ $t('users.columns.actions') }}
          </th>
        </tr>
      </thead>

      <tbody :aria-busy="loading || undefined">
        <!-- * First-load skeleton: placeholder rows keep the header and column layout in place (`isPending` upstream). aria-hidden — aria-busy on the tbody already tells AT the region is loading. -->
        <template v-if="loading">
          <tr v-for="row in 6" :key="row" aria-hidden="true">
            <td v-for="column in 4" :key="column">
              <v-skeleton-loader type="text" />
            </td>

            <td />
          </tr>
        </template>

        <tr v-else-if="users.length === 0">
          <td colspan="5" class="text-center text-medium-emphasis py-8">
            {{ $t('users.empty') }}
          </td>
        </tr>

        <template v-else>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.id }}</td>
            <td>{{ user.name }}</td>
            <td>{{ user.email }}</td>
            <td>
              <v-chip
                :color="user.role === 'admin' ? 'primary' : 'secondary'"
                variant="flat"
                size="small"
              >
                {{ $t(`users.roles.${user.role}`) }}
              </v-chip>
            </td>
            <td class="text-right">
              <v-btn
                :aria-label="$t('users.actions.edit', { name: user.name })"
                icon
                variant="text"
                color="primary"
                size="small"
                @click="emit('edit', user)"
              >
                <v-icon :icon="mdiPencil" />
              </v-btn>

              <v-btn
                v-if="deletable && user.id !== currentUserId"
                :aria-label="$t('users.actions.delete', { name: user.name })"
                icon
                variant="text"
                color="error"
                size="small"
                :loading="deletingId === user.id"
                @click="emit('delete', user)"
              >
                <v-icon :icon="mdiDelete" />
              </v-btn>
            </td>
          </tr>
        </template>
      </tbody>
    </v-table>
  </GapContainer>
</template>

<script setup lang="ts">
import { mdiDelete, mdiPencil } from '@mdi/js';

import type { ComponentPublicInstance } from 'vue';
import type { User } from '@/types/auth';

// ! Stryker instruments this block with locally declared coverage helpers, and a compiler
// ! macro is hoisted out of setup() — referencing them there is a compile error, not a
// ! warning. The defaults inside go unmutated as a result (`catalyst/operations.md`).
// Stryker disable all
withDefaults(
  defineProps<{
    users: User[];
    deletingId?: number | null;
    currentUserId?: number | null;
    // * Off for transports that expose no delete operation, e.g. the GraphQL demo.
    deletable?: boolean;
    // * First load in flight — renders skeleton rows in place of data.
    loading?: boolean;
    // * Background refetch in flight over already-shown rows — shows the top progress bar.
    refreshing?: boolean;
  }>(),
  {
    deletingId: null,
    currentUserId: null,
    deletable: true,
    loading: false,
    refreshing: false
  }
);

const emit = defineEmits<{
  edit: [user: User];
  delete: [user: User];
}>();
// Stryker restore all

const root = useTemplateRef<ComponentPublicInstance>('root');

// * Where the table starts in the viewport, so it can cap at the space below it (footer and page padding included)
const { top } = useElementBounding(root, { windowScroll: false });

// * --page-padding-bottom is published by the layout's page container; the fallback keeps this usable outside it
const maxHeight = computed(
  () =>
    `calc(100dvh - ${top.value}px - var(--v-layout-bottom, 0px) - var(--page-padding-bottom, 0px))`
);
</script>

<style scoped>
/* * Cap the body at the available page height; fixed-header keeps the thead visible while it scrolls */
.users-table :deep(.v-table__wrapper) {
  max-height: v-bind(maxHeight);
}
</style>
