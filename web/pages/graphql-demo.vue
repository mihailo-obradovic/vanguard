<template>
  <!-- * A column the height of `main`, so the table below can take the space that is left rather than growing the page. -->
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

    <!-- ! `min-h-0` is what makes this work: a flex child's default `min-height: auto` refuses to shrink below its content, so the table would grow the page instead of scrolling. -->
    <u-table
      v-else
      :data="users ?? []"
      :columns="columns"
      :loading="isPending"
      sticky
      class="min-h-0 flex-1 rounded-lg bg-default ring ring-default"
    >
      <template #role-cell="{ row }">
        <RoleBadge :role="row.original.role" />
      </template>

      <template #actions-cell="{ row }">
        <!-- ! Icon-only, so the accessible name has to carry the row — see the users table. -->
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
  </div>
</template>

<script setup lang="ts">
import UserGqlFormDialog from '@/components/users/UserGqlFormDialog.vue';

import { useFetchUsersGql } from '@/services/queries/useUserGqlQueries';

import type { User } from '@/types/auth';

// * Worked example for catalyst/features/007_graphql-api.md: this page is written exactly the
// * way the REST pages are — query composables, no loading refs, no try/catch, inline 422s.
// * The only difference from users.vue is which composables it imports.

const { t } = useI18n();

const { data: users, isPending, error } = useFetchUsersGql();

const overlay = useOverlay();

const columns = computed(() => [
  { accessorKey: 'id', header: t('users.columns.id') },
  { accessorKey: 'name', header: t('users.columns.name') },
  { accessorKey: 'email', header: t('users.columns.email') },
  { accessorKey: 'role', header: t('users.columns.role') },
  { id: 'actions', header: t('users.columns.actions') }
]);

function openEditForm(user: User) {
  overlay
    .create(UserGqlFormDialog, { destroyOnClose: true, props: { user } })
    .open();
}
</script>
