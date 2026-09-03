<template>
  <!-- * A column filling `main`, so the table below can take the space that is left rather than growing the page. -->
  <div class="demo-container">
    <header class="demo-header">
      <h1 class="demo-title">{{ $t('graphqlDemo.title') }}</h1>

      <p class="demo-intro">{{ $t('graphqlDemo.intro') }}</p>
    </header>

    <div v-if="isPending" class="state-panel">
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
            <td><RoleBadge :role="user.role" /></td>
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

const { data: users, isPending, error } = useFetchUsersGql();

const editingUser = ref<User | null>(null);

const {
  mutate: updateUser,
  isLoading: isUpdating,
  error: updateError
} = useUpdateUserGql({
  errorHandling: { suppressToasts: 'validation' },
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
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.demo-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.demo-title {
  color: var(--color-brand);
  margin: 0;
  font-size: 32px;
  font-weight: 600;
}

.demo-intro {
  color: var(--color-text-muted);
  margin: 8px 0 0 0;
  font-size: 14px;
}

.state-panel {
  text-align: center;
  padding: 32px;
  background: var(--color-surface);
  border-radius: var(--radius);
  border: 1px solid var(--color-border);
}

.error-panel {
  color: var(--color-danger);
  background-color: var(--color-danger-surface);
  border-color: var(--color-danger-surface-border);
}

/* ! `min-height: 0` is what makes this work: a flex child's default `min-height: auto` refuses to shrink below its content, so the table would grow the page instead of scrolling. Sticky `th`s then keep the column headers in place while the body moves. */
.table-container {
  background: var(--color-surface);
  border-radius: var(--radius);
  border: 1px solid var(--color-border);
  overflow-y: auto;
  min-height: 0;
  box-shadow: var(--shadow-subtle);
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th {
  background-color: var(--color-brand);
  color: var(--color-on-brand);
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  font-size: 14px;
  position: sticky;
  top: 0;
  z-index: 1;
}

.users-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
  font-size: 14px;
}

.user-email {
  color: var(--color-text-muted);
}

.edit-btn {
  background-color: var(--color-brand);
  color: var(--color-on-brand);
  border: none;
  padding: 6px 12px;
  border-radius: var(--radius);
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: background-color var(--transition);
}

.edit-btn:hover:not(:disabled) {
  background-color: var(--color-brand-hover);
}
</style>
