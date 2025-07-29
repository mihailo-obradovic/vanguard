<template>
  <div>
    <h1>Users</h1>

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
import { fetchUsers, deleteUser } from '@/services/user.api';
import type { User } from '@/types/auth';

const users = ref<User[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);
const userToDelete = ref<User | null>(null);
const isDeletingUser = ref<number | null>(null);

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

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString();
}

onMounted(() => {
  loadUsers();
});
</script>

<style scoped lang="scss">
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

.modal h3 {
  margin-top: 0;
  color: #dc3545;
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
</style>
