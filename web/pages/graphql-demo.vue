<template>
  <div class="flex h-full flex-col">
    <header class="mb-6 shrink-0 border-b border-default pb-4">
      <h1 class="text-2xl font-semibold">{{ $t('graphqlDemo.title') }}</h1>

      <p class="mt-2 text-sm text-muted">{{ $t('graphqlDemo.intro') }}</p>
    </header>

    <u-alert
      v-if="error"
      color="error"
      variant="subtle"
      :description="$t('errors.usersLoad', { message: getErrorMessage(error) })"
    />

    <template v-else>
      <!-- * `u-table` has no per-row attribute hook, so the placeholder grid is hidden whole rather than announced as thirty empty rows. This line carries the state. -->
      <p v-if="isPending" class="sr-only" role="status">
        {{ $t('users.loading') }}
      </p>

      <u-table
        :data="tableData"
        :columns="tableColumns"
        :loading="isLoading"
        :empty="$t('users.empty')"
        :aria-hidden="isPending || undefined"
        sticky
        class="min-h-0 flex-1 rounded-lg bg-default ring ring-default"
        :class="isPending && 'overflow-hidden'"
      >
        <template #role-cell="{ row }">
          <RoleBadge :role="row.original.role" />
        </template>

        <template #actions-cell="{ row }">
          <u-button
            size="sm"
            variant="ghost"
            icon="i-lucide-pencil"
            :aria-label="$t('users.actions.edit', { name: row.original.name })"
            class="ms-auto flex"
            @click="openEditForm(row.original)"
          />
        </template>
      </u-table>
    </template>
  </div>
</template>

<script setup lang="ts">
import UserGqlFormDialog from '@/components/users/UserGqlFormDialog.vue';

import { useFetchUsersGql } from '@/services/queries/useUserGqlQueries';

import type { TableColumn } from '@nuxt/ui';
import type { User } from '@/types/auth';

// * Worked example for catalyst/features/007_graphql-api.md: written exactly the way the REST pages are — query composables, no loading refs, no try/catch, inline 422s — so the only difference from users.vue is which composables it imports.

const { t } = useI18n();

// * `isPending` is the first load and gets the skeleton; `isLoading` also spans refetches, which keep stale rows mounted under the table's own bar.
const { data: users, isPending, isLoading, error } = useFetchUsersGql();

const overlay = useOverlay();

const columns = computed<TableColumn<User>[]>(() => [
  { accessorKey: 'id', header: t('users.columns.id') },
  { accessorKey: 'name', header: t('users.columns.name') },
  { accessorKey: 'email', header: t('users.columns.email') },
  { accessorKey: 'role', header: t('users.columns.role') },
  { id: 'actions', header: t('users.columns.actions') }
]);

// * One row action here, not two, so the actions box is narrower than the shared default.
const { data: tableData, columns: tableColumns } = useUserTableSkeleton(
  columns,
  users,
  isPending,
  { actions: 'ms-auto h-7 w-7' }
);

function openEditForm(user: User) {
  overlay
    .create(UserGqlFormDialog, { destroyOnClose: true, props: { user } })
    .open();
}
</script>
