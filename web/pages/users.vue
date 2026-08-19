<template>
  <div>
    <div
      class="border-default mb-6 flex items-center justify-between border-b pb-4"
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
      <p class="text-muted mb-4 text-sm">
        {{ $t('users.total') }}
        <span class="text-highlighted font-semibold">{{ users.length }}</span>
      </p>

      <u-table
        :data="users"
        :columns="columns"
        :loading="isPending"
        class="ring-default rounded-lg ring"
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
          <div class="flex gap-2">
            <u-button
              size="xs"
              variant="soft"
              icon="i-lucide-pencil"
              :aria-label="$t('common.actions.edit')"
              @click="openForm(row.original)"
            >
              {{ $t('common.actions.edit') }}
            </u-button>

            <u-button
              size="xs"
              color="error"
              variant="soft"
              icon="i-lucide-trash-2"
              :aria-label="$t('common.actions.delete')"
              @click="openDelete(row.original)"
            >
              {{ $t('common.actions.delete') }}
            </u-button>
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
