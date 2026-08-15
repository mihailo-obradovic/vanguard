<template>
  <GapContainer class="justify-space-between align-center mb-4">
    <h1>{{ $t('common.nav.users') }}</h1>

    <v-btn
      color="primary"
      :prepend-icon="mdiAccountPlus"
      @click="openCreateForm"
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
    @edit="openEditForm"
    @delete="confirmDelete"
  />

  <UserFormDialog
    v-model="showUserForm"
    :edit-mode="isEditMode"
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

// * Create / edit form state
const showUserForm = ref(false);
const isEditMode = ref(false);
const editingUser = ref<User | null>(null);

function openCreateForm() {
  isEditMode.value = false;
  editingUser.value = null;
  showUserForm.value = true;
}

function openEditForm(user: User) {
  isEditMode.value = true;
  editingUser.value = user;
  showUserForm.value = true;
}

const {
  mutate: createUser,
  isLoading: isCreatingUser,
  error: createUserError
} = useCreateUser({
  errorHandling: { hideValidationToast: true },
  onSuccess: (newUser) => {
    $toast(t('users.toasts.created', { name: newUser.name }), 'success');
    showUserForm.value = false;
  }
});

const {
  mutate: updateUser,
  isLoading: isUpdatingUser,
  error: updateUserError
} = useUpdateUser({
  errorHandling: { hideValidationToast: true },
  onSuccess: (updatedUser) => {
    $toast(t('users.toasts.updated', { name: updatedUser.name }), 'success');
    showUserForm.value = false;
  }
});

const isSubmittingUser = computed(
  () => isCreatingUser.value || isUpdatingUser.value
);

const userFormErrors = useValidationErrors(
  computed(() =>
    isEditMode.value ? updateUserError.value : createUserError.value
  )
);

function handleSubmitUser(form: CreateUserForm) {
  if (isEditMode.value && editingUser.value) {
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

    updateUser({ id: editingUser.value.id, userData: updateData });
  } else {
    createUser(form);
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
