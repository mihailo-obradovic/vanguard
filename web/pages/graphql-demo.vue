<template>
  <div class="demo-container">
    <header class="demo-header">
      <h1 class="demo-title">{{ $t('graphqlDemo.title') }}</h1>

      <p class="demo-intro">{{ $t('graphqlDemo.intro') }}</p>
    </header>

    <div v-if="isLoading" class="state-panel">
      <p>{{ $t('users.loading') }}</p>
    </div>

    <div v-else-if="error" class="state-panel error-panel">
      <p>{{ $t('errors.usersLoad', { message: getErrorMessage(error) }) }}</p>
    </div>

    <div v-else class="table-container">
      <table class="users-table">
        <thead>
          <tr>
            <th>{{ $t('users.columns.id') }}</th>
            <th>{{ $t('users.columns.name') }}</th>
            <th>{{ $t('users.columns.email') }}</th>
            <th>{{ $t('users.columns.role') }}</th>
            <th>{{ $t('users.columns.actions') }}</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.id }}</td>
            <td>{{ user.name }}</td>
            <td class="user-email">{{ user.email }}</td>
            <td>
              <span class="role-badge" :class="user.role">
                {{ $t(`users.roles.${user.role}`) }}
              </span>
            </td>
            <td>
              <button class="edit-btn" @click="openEditForm(user)">
                {{ $t('common.actions.edit') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <UserGqlFormDialog
      :user="editingUser"
      :submitting="isUpdating"
      :server-errors="formErrors"
      @update="updateUser"
      @close="closeEditForm"
    />
  </div>
</template>

<script setup lang="ts">
import UserGqlFormDialog from '@/components/users/UserGqlFormDialog.vue';

import {
  useFetchUsersGql,
  useUpdateUserGql
} from '@/services/queries/useUserGqlQueries';
import type { User } from '@/types/auth';

// * Worked example for catalyst/features/007_graphql-api.md: this page is written exactly the
// * way the REST pages are — query composables, no loading refs, no try/catch, inline 422s.
// * The only difference from users.vue is which composables it imports.

const { t } = useI18n();

const { data: users, isLoading, error } = useFetchUsersGql();

const editingUser = ref<User | null>(null);

const {
  mutate: updateUser,
  isLoading: isUpdating,
  error: updateError
} = useUpdateUserGql({
  errorHandling: { hideValidationToast: true },
  onSuccess: (updatedUser) => {
    $toast(t('users.toasts.updated', { name: updatedUser.name }), 'success');
    closeEditForm();
  }
});

const formErrors = useValidationErrors(updateError);

function openEditForm(user: User) {
  editingUser.value = user;
}

function closeEditForm() {
  editingUser.value = null;
}
</script>

<style scoped>
.demo-container {
  max-width: 1000px;
  margin: 0 auto;
}

.demo-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e9ecef;
}

.demo-title {
  color: rgb(0, 102, 255);
  margin: 0;
  font-size: 32px;
  font-weight: 600;
}

.demo-intro {
  color: #6c757d;
  margin: 8px 0 0 0;
  font-size: 14px;
}

.state-panel {
  text-align: center;
  padding: 32px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.error-panel {
  color: #dc3545;
  background-color: #f8d7da;
  border-color: #f5c6cb;
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
</style>
