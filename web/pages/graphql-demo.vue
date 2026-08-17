<template>
  <GapContainer column class="mb-4">
    <h1>{{ $t('graphqlDemo.title') }}</h1>

    <p class="text-medium-emphasis text-body-2">
      {{ $t('graphqlDemo.intro') }}
    </p>
  </GapContainer>

  <UsersTable
    :users="users"
    :loading="isPending"
    :refreshing="isLoading && !isPending"
    :deletable="false"
    @edit="openEditForm"
  />

  <UserDetailsDialog
    v-model="showEditForm"
    :user="editingUser"
    :loading="isUpdating"
    :server-errors="formErrors"
    @confirm="handleSubmit"
    @after-leave="handleEditFormAfterLeave"
  />
</template>

<script setup lang="ts">
import UsersTable from '@/components/users/UsersTable.vue';
import UserDetailsDialog from '@/components/users/UserDetailsDialog.vue';

import {
  useFetchUsersGql,
  useUpdateUserGql
} from '@/services/queries/useUserGqlQueries';

import type { UserDetailsForm } from '@/components/users/UserDetailsDialog.vue';

// * Worked example for catalyst/features/007_graphql-api.md: this page is written exactly the
// * way the REST pages are — query composables, no loading refs, no try/catch, inline 422s.
// * The only difference from users.vue is which composables it imports.

const { t } = useI18n();

// * isPending covers only the first load (skeleton rows); isLoading also spans invalidation refetches, which keep the stale rows mounted under the refresh bar
const { data, isPending, isLoading } = useFetchUsersGql();

const users = computed(() => data.value ?? []);

const {
  dialog: showEditForm,
  subject: editingUser,
  open: openEditForm,
  submit: updateUser,
  loading: isUpdating,
  errors: formErrors,
  afterLeave: handleEditFormAfterLeave
} = useMutationDialog(useUpdateUserGql, (updatedUser) =>
  $toast(t('users.toasts.updated', { name: updatedUser.name }), 'success')
);

function handleSubmit(form: UserDetailsForm) {
  if (!editingUser.value) {
    return;
  }

  // * Partial update: only the fields the admin actually changed go on the wire — omitted
  // * GraphQL variables never reach the resolver, so untouched fields keep their values.
  updateUser({
    id: editingUser.value.id,
    ...changedFields(editingUser.value, form)
  });
}
</script>
