<template>
  <div class="users-container">
    <div class="users-header">
      <h1 class="users-title">Users Management</h1>

      <div class="actions-bar">
        <button class="create-btn" @click="openCreateForm">
          Create New User
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="loading-state">
      <p>Loading users...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>Error loading users: {{ getErrorMessage(error) }}</p>
    </div>

    <div v-else class="users-content">
      <div class="users-stats">
        <p>
          Total users:
          <span class="stats-number">{{ users.length }}</span>
        </p>
      </div>

      <div class="table-container">
        <table class="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Email Verified</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="user in users" :key="user.id" class="user-row">
              <td>{{ user.id }}</td>
              <td class="user-name">{{ user.name }}</td>
              <td class="user-email">{{ user.email }}</td>
              <td>
                <span class="role-badge" :class="user.role">
                  {{ user.role }}
                </span>
              </td>
              <td>
                <span
                  class="verification-badge"
                  :class="{ verified: user.email_verified_at }"
                >
                  {{ user.email_verified_at ? 'Yes' : 'No' }}
                </span>
              </td>
              <td class="created-date">{{ formatDate(user.created_at) }}</td>
              <td class="actions-cell">
                <button
                  class="edit-btn"
                  :disabled="isDeletingUser === user.id"
                  @click="openEditForm(user)"
                >
                  Edit
                </button>

                <button
                  class="delete-btn"
                  :disabled="isDeletingUser === user.id"
                  @click="confirmDelete(user)"
                >
                  {{ isDeletingUser === user.id ? 'Deleting...' : 'Delete' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create/Edit User Form -->
    <div v-if="showUserForm" class="modal-overlay" @click="closeUserForm">
      <div
        ref="userFormModal"
        class="modal form-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-form-title"
        tabindex="-1"
        @click.stop
        @keydown.esc="closeUserForm"
      >
        <div class="modal-header">
          <h3 id="user-form-title" class="modal-title">
            {{ isEditMode ? 'Edit User' : 'Create New User' }}
          </h3>
        </div>

        <form class="user-form" novalidate @submit.prevent="handleSubmitUser">
          <div class="form-group">
            <label for="name" class="form-label">Name</label>

            <input
              id="name"
              v-model="userForm.name"
              type="text"
              class="form-input"
              required
              :disabled="isSubmittingUser"
            />

            <FieldErrors :errors="r$.name.$errors" />
          </div>

          <div class="form-group">
            <label for="email" class="form-label">Email</label>

            <input
              id="email"
              v-model="userForm.email"
              type="email"
              class="form-input"
              required
              :disabled="isSubmittingUser"
            />

            <FieldErrors :errors="r$.email.$errors" />
          </div>

          <div class="form-group">
            <label for="password" class="form-label">
              Password {{ isEditMode ? '(leave empty to keep current)' : '' }}
            </label>

            <input
              id="password"
              v-model="userForm.password"
              type="password"
              class="form-input"
              :required="!isEditMode"
              :disabled="isSubmittingUser"
            />

            <FieldErrors :errors="r$.password.$errors" />
          </div>

          <div class="form-group">
            <label for="password_confirmation" class="form-label">
              Password Confirmation
              {{ isEditMode ? '(required if changing password)' : '' }}
            </label>

            <input
              id="password_confirmation"
              v-model="userForm.password_confirmation"
              type="password"
              class="form-input"
              :required="!isEditMode || !!userForm.password"
              :disabled="isSubmittingUser"
            />

            <FieldErrors :errors="r$.password_confirmation.$errors" />
          </div>

          <div class="form-group">
            <label for="role" class="form-label">Role</label>

            <select
              id="role"
              v-model="userForm.role"
              class="form-select"
              required
              :disabled="isSubmittingUser"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div class="modal-actions">
            <button
              type="button"
              class="cancel-btn"
              :disabled="isSubmittingUser"
              @click="closeUserForm"
            >
              Cancel
            </button>

            <button
              type="submit"
              class="submit-btn"
              :disabled="isSubmittingUser || r$.$invalid"
            >
              {{
                isSubmittingUser
                  ? 'Saving...'
                  : isEditMode
                    ? 'Update User'
                    : 'Create User'
              }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Confirmation Dialog -->
    <div v-if="userToDelete" class="modal-overlay" @click="cancelDelete">
      <div
        ref="confirmDeleteModal"
        class="modal confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
        tabindex="-1"
        @click.stop
        @keydown.esc="cancelDelete"
      >
        <div class="modal-header">
          <h3 id="confirm-delete-title" class="modal-title danger">
            Confirm Delete
          </h3>
        </div>

        <div class="modal-content">
          <p>
            Are you sure you want to delete user
            <strong>"{{ userToDelete.name }}"</strong>
            ?
          </p>

          <p class="warning-text">This action cannot be undone.</p>
        </div>

        <div class="modal-actions">
          <button
            class="cancel-btn"
            :disabled="isDeleting"
            @click="cancelDelete"
          >
            Cancel
          </button>

          <button
            class="confirm-delete-btn"
            :disabled="isDeleting"
            @click="handleDelete"
          >
            {{ isDeleting ? 'Deleting...' : 'Delete User' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { email, maxLength, required } from '@regle/rules';

import {
  useFetchUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser
} from '@/services/queries/useUserQueries';
import type { User } from '@/types/auth';
import type { CreateUserForm, UpdateUserForm } from '@/types/user';

const userFormModal = useTemplateRef('userFormModal');
const confirmDeleteModal = useTemplateRef('confirmDeleteModal');

const { data: usersResponse, isLoading, error } = useFetchUsers();

const userToDelete = ref<User | null>(null);

// Create/Edit form state
const showUserForm = ref(false);
const isEditMode = ref(false);
const editingUserId = ref<number | null>(null);
const userForm = ref<CreateUserForm>({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  role: 'user'
});

const {
  mutate: createUser,
  isLoading: isCreatingUser,
  error: createUserError
} = useCreateUser({
  errorHandling: { hideValidationToast: true },
  onSuccess: (newUser) => {
    $toast(`User "${newUser.name}" created successfully`, 'success');
    closeUserForm();
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
    closeUserForm();
  }
});

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

const userFormErrors = useValidationErrors(
  computed(() =>
    isEditMode.value ? updateUserError.value : createUserError.value
  )
);

// Create requires a password; edit only validates one when entered.
const { r$ } = useRegle(
  userForm,
  () => ({
    name: { required, maxLength: maxLength(255) },
    email: { required, email, maxLength: maxLength(255) },
    ...newPasswordRules(
      () => userForm.value.password,
      () => isEditMode.value
    )
  }),
  { externalErrors: useExternalErrors(() => userFormErrors.value) }
);

const users = computed(() => usersResponse.value?.data ?? []);

const isSubmittingUser = computed(
  () => isCreatingUser.value || isUpdatingUser.value
);

const isDeletingUser = computed(() =>
  isDeleting.value ? (deletingId.value ?? null) : null
);

function confirmDelete(user: User) {
  userToDelete.value = user;
}

function cancelDelete() {
  userToDelete.value = null;
}

function handleDelete() {
  if (!userToDelete.value) return;

  deleteUser(userToDelete.value.id);
}

// Create/Edit form functions
function openCreateForm() {
  isEditMode.value = false;
  editingUserId.value = null;
  userForm.value = {
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'user'
  };
  r$.$reset();
  showUserForm.value = true;
}

function openEditForm(user: User) {
  isEditMode.value = true;
  editingUserId.value = user.id;
  userForm.value = {
    name: user.name,
    email: user.email,
    password: '',
    password_confirmation: '',
    role: user.role
  };
  r$.$reset();
  showUserForm.value = true;
}

function closeUserForm() {
  showUserForm.value = false;
  isEditMode.value = false;
  editingUserId.value = null;
  userForm.value = {
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'user'
  };
}

async function handleSubmitUser() {
  const { valid } = await r$.$validate();

  if (!valid) {
    return;
  }

  if (isEditMode.value && editingUserId.value) {
    const updateData: UpdateUserForm = {
      name: userForm.value.name,
      email: userForm.value.email,
      role: userForm.value.role
    };

    // Only include password if provided
    if (userForm.value.password) {
      updateData.password = userForm.value.password;
      updateData.password_confirmation = userForm.value.password_confirmation;
    }

    updateUser({ id: editingUserId.value, userData: updateData });
  } else {
    createUser(userForm.value);
  }
}

// Move focus into the dialogs so Escape and keyboard navigation work without
// a pointer.
watch(showUserForm, async (isOpen) => {
  if (isOpen) {
    await nextTick();
    userFormModal.value?.focus();
  }
});

watch(userToDelete, async (user) => {
  if (user) {
    await nextTick();
    confirmDeleteModal.value?.focus();
  }
});
</script>

<style scoped>
.users-container {
  max-width: 1200px;
  margin: 0 auto;
}

.users-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e9ecef;
}

.users-title {
  color: rgb(0, 102, 255);
  margin: 0;
  font-size: 32px;
  font-weight: 600;
}

.actions-bar {
  display: flex;
  gap: 16px;
}

.create-btn {
  background-color: rgb(0, 102, 255);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.25s ease;
  font-size: 14px;
}

.create-btn:hover {
  background-color: rgba(0, 102, 255, 0.9);
}

.loading-state,
.error-state {
  text-align: center;
  padding: 32px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.error-state {
  color: #dc3545;
  background-color: #f8d7da;
  border-color: #f5c6cb;
}

.users-stats {
  margin-bottom: 16px;
}

.users-stats p {
  color: #495057;
  margin: 0;
  font-size: 16px;
}

.stats-number {
  font-weight: 600;
  color: rgb(0, 102, 255);
}

.table-container {
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th {
  background-color: rgb(0, 102, 255);
  color: white;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  font-size: 14px;
}

.users-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #e9ecef;
  font-size: 14px;
}

.user-row:hover {
  background-color: #f8f9fa;
}

.user-name {
  font-weight: 500;
  color: #495057;
}

.user-email {
  color: #6c757d;
}

.role-badge {
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
}

.role-badge.admin {
  background-color: #dc3545;
  color: white;
}

.role-badge.user {
  background-color: #28a745;
  color: white;
}

.verification-badge {
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
}

.verification-badge.verified {
  background-color: #28a745;
  color: white;
}

.verification-badge:not(.verified) {
  background-color: #ffc107;
  color: #000;
}

.created-date {
  color: #6c757d;
  font-size: 13px;
}

.actions-cell {
  display: flex;
  gap: 8px;
}

.edit-btn {
  background-color: rgb(0, 102, 255);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: background-color 0.25s ease;
}

.edit-btn:hover:not(:disabled) {
  background-color: rgba(0, 102, 255, 0.9);
}

.edit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.delete-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: background-color 0.25s ease;
}

.delete-btn:hover:not(:disabled) {
  background-color: #c82333;
}

.delete-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal {
  background: white;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* The container is focused programmatically on open; the visible focus ring
   belongs on the controls inside, not the dialog itself. */
.modal:focus {
  outline: none;
}

.form-modal {
  max-width: 500px;
}

.modal-header {
  padding: 24px 24px 0 24px;
}

.modal-title {
  margin: 0;
  color: rgb(0, 102, 255);
  font-size: 24px;
  font-weight: 600;
}

.modal-title.danger {
  color: #dc3545;
}

.modal-content {
  padding: 16px 24px;
}

.modal-content p {
  margin: 0 0 8px 0;
  color: #495057;
}

.warning-text {
  color: #dc3545;
  font-size: 14px;
  font-style: italic;
}

.user-form {
  padding: 16px 24px 0 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  color: #495057;
  font-weight: 500;
  font-size: 14px;
}

.form-input,
.form-select {
  padding: 8px 16px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.25s ease;
  background-color: white;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: rgb(0, 102, 255);
  box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
}

.form-input:disabled,
.form-select:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
  opacity: 0.7;
}

.modal-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  padding: 24px;
  border-top: 1px solid #e9ecef;
  margin-top: 16px;
}

.cancel-btn {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.25s ease;
}

.cancel-btn:hover {
  background-color: #5a6268;
}

.submit-btn {
  background-color: rgb(0, 102, 255);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.25s ease;
}

.submit-btn:hover:not(:disabled) {
  background-color: rgba(0, 102, 255, 0.9);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.confirm-delete-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.25s ease;
}

.confirm-delete-btn:hover:not(:disabled) {
  background-color: #c82333;
}

.cancel-btn:disabled,
.confirm-delete-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
