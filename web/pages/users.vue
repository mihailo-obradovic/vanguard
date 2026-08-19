<template>
  <!-- * A column the height of `main`, so the table below can take the space that is left rather than growing the page. -->
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
        <span class="font-semibold text-highlighted">{{ users.length }}</span>
      </p>

      <!-- ! `min-h-0` is what makes this work: a flex child's default `min-height: auto` refuses to shrink below its content, so the table would grow the page instead of scrolling. `sticky` then keeps the column headers in place while its body moves. -->
      <u-table
        :data="users"
        :columns="columns"
        :loading="isPending"
        sticky
        class="min-h-0 flex-1 rounded-lg bg-default ring ring-default"
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
          <!-- ! Icon-only, so the accessible name has to carry the row: 38 buttons all called "Edit" tell a screen-reader user nothing about which user they are about to change. -->
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

import type { User } from '@/types/auth';

const { t } = useI18n();

const { data: usersResponse, isPending, error } = useFetchUsers();

const users = computed(() => usersResponse.value?.data ?? []);

// * The dialogs own their own mutations and the list is invalidated by the query layer, so the page only has to open them.
const overlay = useOverlay();

const columns = computed(() => [
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
