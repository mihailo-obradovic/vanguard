<template>
  <div>
    <h1>Users</h1>

    <div class="actions-bar">
      <button class="create-btn" @click="openCreateForm">
        Create New User
      </button>
    </div>

    <div v-if="isLoading">Loading users...</div>

    <div v-else-if="error" class="error">Error loading users: {{ error }}</div>

    <div v-else>
      <p>Total users: {{ users.length }}</p>

      <table>
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
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.id }}</td>
            <td>{{ user.name }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.role }}</td>
            <td>{{ user.email_verified_at ? 'Yes' : 'No' }}</td>
            <td>{{ formatDate(user.created_at) }}</td>
            <td>
              <button
                class="edit-btn"
                :disabled="isDeletingUser === user.id"
                @click="openEditForm(user)"
              >
                Edit
              </button>
              <button
                :disabled="isDeletingUser === user.id"
                class="delete-btn"
                @click="confirmDelete(user)"
              >
                {{ isDeletingUser === user.id ? 'Deleting...' : 'Delete' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create/Edit User Form -->
    <div v-if="showUserForm" class="modal-overlay" @click="closeUserForm">
      <div class="modal form-modal" @click.stop>
        <h3>{{ isEditMode ? 'Edit User' : 'Create New User' }}</h3>

        <form @submit.prevent="handleSubmitUser">
          <div class="form-group">
            <label for="name">Name</label>
            <input
              id="name"
              v-model="userForm.name"
              type="text"
              required
              :disabled="isSubmittingUser"
            />
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              v-model="userForm.email"
              type="email"
              required
              :disabled="isSubmittingUser"
            />
          </div>

          <div class="form-group">
            <label for="password">
              Password {{ isEditMode ? '(leave empty to keep current)' : '' }}
            </label>
            <input
              id="password"
              v-model="userForm.password"
              type="password"
              :required="!isEditMode"
              :disabled="isSubmittingUser"
            />
          </div>

          <div class="form-group">
            <label for="password_confirmation">
              Password Confirmation
              {{ isEditMode ? '(required if changing password)' : '' }}
            </label>
            <input
              id="password_confirmation"
              v-model="userForm.password_confirmation"
              type="password"
              :required="!isEditMode || !!userForm.password"
              :disabled="isSubmittingUser"
            />
          </div>

          <div class="form-group">
            <label for="role">Role</label>
            <select
              id="role"
              v-model="userForm.role"
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
              :disabled="isSubmittingUser"
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
      <div class="modal" @click.stop>
        <h3>Confirm Delete</h3>
        <p>Are you sure you want to delete user "{{ userToDelete.name }}"?</p>
        <p>This action cannot be undone.</p>

        <div class="modal-actions">
          <button class="cancel-btn" @click="cancelDelete">Cancel</button>
          <button class="confirm-delete-btn" @click="handleDelete">
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  fetchUsers,
  deleteUser,
  createUser,
  updateUser
} from '@/services/user.api';
import type { User } from '@/types/auth';
import type { CreateUserForm, UpdateUserForm } from '@/types/user';

const users = ref<User[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);
const userToDelete = ref<User | null>(null);
const isDeletingUser = ref<number | null>(null);

// Create/Edit form state
const showUserForm = ref(false);
const isEditMode = ref(false);
const isSubmittingUser = ref(false);
const editingUserId = ref<number | null>(null);
const userForm = ref<CreateUserForm>({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  role: 'user'
});

async function loadUsers() {
  try {
    isLoading.value = true;
    error.value = null;

    const response = await fetchUsers();
    users.value = response.data;
  } catch (err: any) {
    error.value = err.message || 'Failed to load users';
    $toast(error.value, 'error');
  } finally {
    isLoading.value = false;
  }
}

function confirmDelete(user: User) {
  userToDelete.value = user;
}

function cancelDelete() {
  userToDelete.value = null;
}

async function handleDelete() {
  if (!userToDelete.value) return;

  const user = userToDelete.value;

  try {
    isDeletingUser.value = user.id;

    await deleteUser(user.id);

    // Remove user from local array
    users.value = users.value.filter((u) => u.id !== user.id);

    $toast(`User "${user.name}" deleted successfully`, 'success');
  } catch (err: any) {
    $toast(err?.data?.message || 'Failed to delete user', 'error');
  } finally {
    isDeletingUser.value = null;
    userToDelete.value = null;
  }
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
  if (!userForm.value.name || !userForm.value.email) return;

  // Validate password confirmation
  if (
    userForm.value.password &&
    userForm.value.password !== userForm.value.password_confirmation
  ) {
    $toast('Password confirmation does not match', 'error');
    return;
  }

  // For edit mode, if password is provided, confirmation is required
  if (
    isEditMode.value &&
    userForm.value.password &&
    !userForm.value.password_confirmation
  ) {
    $toast('Password confirmation is required when changing password', 'error');
    return;
  }

  try {
    isSubmittingUser.value = true;

    if (isEditMode.value && editingUserId.value) {
      // Update existing user
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

      const updatedUser = await updateUser(editingUserId.value, updateData);

      // Update user in local array
      const index = users.value.findIndex((u) => u.id === editingUserId.value);
      if (index !== -1) {
        users.value[index] = updatedUser;
      }

      $toast(`User "${updatedUser.name}" updated successfully`, 'success');
    } else {
      // Create new user
      const newUser = await createUser(userForm.value);

      // Add new user to local array
      users.value.unshift(newUser);

      $toast(`User "${newUser.name}" created successfully`, 'success');
    }

    closeUserForm();
  } catch (err: any) {
    $toast(err?.data?.message || 'Failed to save user', 'error');
  } finally {
    isSubmittingUser.value = false;
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString();
}

onMounted(() => {
  loadUsers();
});
</script>

<style scoped lang="scss">
.actions-bar {
  margin-bottom: 1rem;
}

.create-btn {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #218838;
  }
}

.error {
  color: red;
  padding: 1rem;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 4px;
  margin-bottom: 1rem;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

th,
td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

th {
  background-color: #f5f5f5;
  font-weight: bold;
}

.edit-btn {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 8px;

  &:hover:not(:disabled) {
    background-color: #0056b3;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.delete-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;

  &:hover:not(:disabled) {
    background-color: #c82333;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
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
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 400px;
  width: 90%;
}

.form-modal {
  max-width: 500px;
}

.modal h3 {
  margin-top: 0;
  color: #dc3545;
}

.form-group {
  margin-bottom: 1rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
  }

  input,
  select {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;

    &:focus {
      outline: none;
      border-color: #007bff;
    }

    &:disabled {
      background-color: #f8f9fa;
      cursor: not-allowed;
    }
  }
}

.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  justify-content: flex-end;
}

.cancel-btn {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #5a6268;
  }
}

.confirm-delete-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #c82333;
  }
}

.submit-btn {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;

  &:hover:not(:disabled) {
    background-color: #218838;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
</style>
