<template>
  <div class="flex h-full flex-col">
    <div
      class="mb-6 flex shrink-0 items-center justify-between border-b border-default pb-4"
    >
      <h1 class="text-2xl font-semibold">{{ $t('users.title') }}</h1>

      <u-button icon="i-lucide-plus" @click="openForm()">
        {{ $t('users.create') }}
      </u-button>
    </div>

    <u-alert
      v-if="error"
      color="error"
      variant="subtle"
      :description="$t('errors.usersLoad', { message: getErrorMessage(error) })"
    />

    <template v-else>
      <p class="mb-4 shrink-0 text-sm text-muted">
        {{ $t('users.total') }}

        <!-- * Left live this reads "0" under a screen of skeleton rows, then snaps. -->
        <u-skeleton
          v-if="isPending"
          class="inline-block h-4 w-8 align-middle"
        />

        <span v-else class="font-semibold text-highlighted">
          {{ users.length }}
        </span>
      </p>

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

        <template #email_verified_at-cell="{ row }">
          <VerificationBadge :verified="!!row.original.email_verified_at">
            {{
              row.original.email_verified_at
                ? $t('users.verified.yes')
                : $t('users.verified.no')
            }}
          </VerificationBadge>
        </template>

        <template #created_at-cell="{ row }">
          {{ formatDate(row.original.created_at) }}
        </template>

        <template #actions-cell="{ row }">
          <div class="flex justify-end gap-1">
            <u-button
              size="sm"
              variant="ghost"
              icon="i-lucide-pencil"
              :aria-label="
                $t('users.actions.edit', { name: row.original.name })
              "
              @click="openForm(row.original)"
            />

            <u-button
              size="sm"
              color="error"
              variant="ghost"
              icon="i-lucide-trash-2"
              :aria-label="
                $t('users.actions.delete', { name: row.original.name })
              "
              @click="openDelete(row.original)"
            />
          </div>
        </template>
      </u-table>
    </template>
  </div>
</template>

<script setup lang="ts">
import UserFormDialog from '@/components/users/UserFormDialog.vue';
import DeleteUserDialog from '@/components/users/DeleteUserDialog.vue';

import { useFetchUsers } from '@/services/queries/useUserQueries';

import type { TableColumn } from '@nuxt/ui';
import type { User } from '@/types/auth';

const { t } = useI18n();

// * `isPending` is the first load and gets the skeleton; `isLoading` also spans refetches, which keep stale rows mounted under the table's own bar.
const { data: usersResponse, isPending, isLoading, error } = useFetchUsers();

const users = computed(() => usersResponse.value?.data ?? []);

const overlay = useOverlay();

const columns = computed<TableColumn<User>[]>(() => [
  { accessorKey: 'id', header: t('users.columns.id') },
  { accessorKey: 'name', header: t('users.columns.name') },
  { accessorKey: 'email', header: t('users.columns.email') },
  { accessorKey: 'role', header: t('users.columns.role') },
  {
    accessorKey: 'email_verified_at',
    header: t('users.columns.emailVerified')
  },
  { accessorKey: 'created_at', header: t('users.columns.createdAt') },
  { id: 'actions', header: t('users.columns.actions') }
]);

const { data: tableData, columns: tableColumns } = useUserTableSkeleton(
  columns,
  users,
  isPending
);

function openForm(user: User | null = null) {
  overlay
    .create(UserFormDialog, { destroyOnClose: true, props: { user } })
    .open();
}

function openDelete(user: User) {
  overlay
    .create(DeleteUserDialog, { destroyOnClose: true, props: { user } })
    .open();
}
</script>
