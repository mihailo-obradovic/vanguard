<template>
  <!-- ! `min-height: 0` down the chain below is what makes the cap work: a flex child's default `min-height: auto` refuses to shrink below its content, so the table would grow the page instead of scrolling. `fixed-header` then keeps the column headers in place while the body moves. -->
  <GapContainer
    type="VSheet"
    elevation="1"
    class="users-table-sheet rounded-lg position-relative flex-1-1"
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
</script>

<style scoped>
/* * The sheet is a column so the table can take the height that is left in it, and the table is
   one so its scrolling wrapper can do the same inside that. Flexbox arrives at the same cap the
   measured version computed, and re-adapts on resize without watching anything. */
.users-table-sheet {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.users-table {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1 1 auto;
}

.users-table :deep(.v-table__wrapper) {
  min-height: 0;
  flex: 1 1 auto;
}
</style>
