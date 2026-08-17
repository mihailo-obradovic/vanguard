<template>
  <GapContainer class="justify-space-between align-center mb-4">
    <h1>{{ $t('common.nav.users') }}</h1>

    <v-btn
      color="primary"
      :prepend-icon="mdiAccountPlus"
      @click="openUserForm('create')"
    >
      {{ $t('users.create') }}
    </v-btn>
  </GapContainer>

  <UsersTable
    :users="users"
    :loading="isPending"
    :refreshing="isLoading && !isPending"
    :deleting-id="deletingUserId"
    :current-user-id="currentUser?.id ?? null"
    @edit="openUserForm('update', $event)"
    @delete="confirmDelete"
  />

  <UserFormDialog
    v-model="showUserForm"
    :edit-mode="userFormMode === 'update'"
    :user="editingUser"
    :loading="isSubmittingUser"
    :server-errors="userFormErrors"
    @confirm="handleSubmitUser"
  />

  <ConfirmDialog
    v-model="showDeleteDialog"
    :title="$t('users.delete.title')"
    :message="deleteMessage"
    :loading="isDeleting"
    destructive
    @cancel="cancelDelete"
    @confirm="handleDelete"
    @after-leave="handleDeleteDialogAfterLeave"
  />
</template>

<script setup lang="ts">
import { mdiAccountPlus } from '@mdi/js';

import UsersTable from '@/components/users/UsersTable.vue';
import UserFormDialog from '@/components/users/UserFormDialog.vue';

import {
  useFetchUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser
} from '@/services/queries/useUserQueries';

import type { User } from '@/types/auth';
import type { CreateUserForm, UpdateUserForm } from '@/types/user';

const { t } = useI18n();

const { user: currentUser } = storeToRefs(useAuthStore());

// * isPending covers only the first load (skeleton rows); isLoading also spans invalidation refetches, which keep the stale rows mounted under the refresh bar
const { data, isPending, isLoading } = useFetchUsers();

const users = computed(() => data.value?.data ?? []);

// * One dialog, two mutations: the mode it was opened in decides which one runs, which errors it shows, and which toast it ends on.
const {
  dialog: showUserForm,
  mode: userFormMode,
  subject: editingUser,
  open: openUserForm,
  submit: submitUser,
  loading: isSubmittingUser,
  errors: userFormErrors
} = useMutationDialog(
  { create: useCreateUser, update: useUpdateUser },
  {
    onSuccess: (user, mode) =>
      $toast(
        t(mode === 'create' ? 'users.toasts.created' : 'users.toasts.updated', {
          name: user.name
        }),
        'success'
      )
  }
);

function handleSubmitUser(form: CreateUserForm) {
  if (userFormMode.value === 'update' && editingUser.value) {
    const updateData: UpdateUserForm = {
      name: form.name,
      email: form.email,
      role: form.role
    };

    // * Only include the password when the admin is changing it.
    if (form.password) {
      updateData.password = form.password;
      updateData.password_confirmation = form.password_confirmation;
    }

    submitUser.update({ id: editingUser.value.id, userData: updateData });
  } else {
    submitUser.create(form);
  }
}

// * Delete state. userToDelete outlives showDeleteDialog so the message doesn't empty out mid fade-out; after-leave clears it.
const userToDelete = ref<User | null>(null);

const showDeleteDialog = ref(false);

const deleteMessage = computed(() =>
  userToDelete.value
    ? t('users.delete.confirm', { name: userToDelete.value.name })
    : ''
);

function confirmDelete(user: User) {
  // * Users can't delete themselves.
  if (user.id === currentUser.value?.id) {
    return;
  }

  userToDelete.value = user;
  showDeleteDialog.value = true;
}

function cancelDelete() {
  showDeleteDialog.value = false;
}

function handleDeleteDialogAfterLeave() {
  userToDelete.value = null;
}

const {
  mutate: deleteUser,
  isLoading: isDeleting,
  variables: deletingId
} = useDeleteUser({
  onSuccess: () => {
    $toast(
      t('users.toasts.deleted', { name: userToDelete.value?.name ?? '' }),
      'success'
    );
  },
  onSettled: () => {
    showDeleteDialog.value = false;
  }
});

const deletingUserId = computed(() =>
  isDeleting.value ? (deletingId.value ?? null) : null
);

function handleDelete() {
  if (!userToDelete.value) {
    return;
  }

  deleteUser(userToDelete.value.id);
}
</script>
