<template>
  <LoadingSpinner v-if="isLoading" :model-value="true" fill-height />

  <template v-else>
    <GapContainer class="justify-space-between align-center mb-4">
      <h1>Users</h1>

      <v-btn
        color="primary"
        :prepend-icon="mdiAccountPlus"
        @click="openCreateForm"
      >
        Create User
      </v-btn>
    </GapContainer>

    <UsersTable
      :users="users"
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
      title="Delete user"
      :message="deleteMessage"
      :loading="isDeleting"
      @cancel="cancelDelete"
      @confirm="handleDelete"
    />
  </template>
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

const { user: currentUser } = storeToRefs(useAuthStore());

const { data, isLoading } = useFetchUsers();

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
    $toast(`User "${newUser.name}" created successfully`, 'success');
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
    $toast(`User "${updatedUser.name}" updated successfully`, 'success');
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

// * Delete state
const userToDelete = ref<User | null>(null);

const showDeleteDialog = computed({
  get: () => userToDelete.value !== null,
  set: (value) => {
    if (!value) {
      userToDelete.value = null;
    }
  }
});

const deleteMessage = computed(() =>
  userToDelete.value
    ? `Are you sure you want to delete "${userToDelete.value.name}"?`
    : ''
);

function confirmDelete(user: User) {
  // * Users can't delete themselves.
  if (user.id === currentUser.value?.id) {
    return;
  }

  userToDelete.value = user;
}

function cancelDelete() {
  userToDelete.value = null;
}

const {
  mutate: deleteUser,
  isLoading: isDeleting,
  variables: deletingId
} = useDeleteUser({
  onSuccess: () => {
    $toast(
      `User "${userToDelete.value?.name}" deleted successfully`,
      'success'
    );
  },
  onSettled: () => {
    userToDelete.value = null;
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
