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

    <div v-if="editingUser" class="modal-overlay" @click="closeEditForm">
      <div
        ref="editModal"
        class="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="graphql-edit-title"
        tabindex="-1"
        @click.stop
        @keydown.esc="closeEditForm"
      >
        <div class="modal-header">
          <h2 id="graphql-edit-title" class="modal-title">
            {{ $t('graphqlDemo.editTitle', { name: editingUser.name }) }}
          </h2>
        </div>

        <form class="user-form" novalidate @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="gql-name" class="form-label">
              {{ $t('common.fields.name') }}
            </label>

            <input
              id="gql-name"
              v-model="userForm.name"
              type="text"
              class="form-input"
              :disabled="isUpdating"
            />

            <FieldErrors :errors="r$.name.$errors" />
          </div>

          <div class="form-group">
            <label for="gql-email" class="form-label">
              {{ $t('common.fields.email') }}
            </label>

            <input
              id="gql-email"
              v-model="userForm.email"
              type="email"
              class="form-input"
              :disabled="isUpdating"
            />

            <FieldErrors :errors="r$.email.$errors" />
          </div>

          <div class="form-group">
            <label for="gql-role" class="form-label">
              {{ $t('common.fields.role') }}
            </label>

            <select
              id="gql-role"
              v-model="userForm.role"
              class="form-select"
              :disabled="isUpdating"
            >
              <option value="user">{{ $t('users.roles.user') }}</option>
              <option value="admin">{{ $t('users.roles.admin') }}</option>
            </select>
          </div>

          <div class="modal-actions">
            <button
              type="button"
              class="cancel-btn"
              :disabled="isUpdating"
              @click="closeEditForm"
            >
              {{ $t('common.actions.cancel') }}
            </button>

            <button
              type="submit"
              class="submit-btn"
              :disabled="isUpdating || r$.$invalid"
            >
              {{
                isUpdating
                  ? $t('common.actions.saving')
                  : $t('users.form.submitUpdate')
              }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { email, maxLength, required } from '@regle/rules';

import {
  useFetchUsersGql,
  useUpdateUserGql
} from '@/services/queries/useUserGqlQueries';
import type { User } from '@/types/auth';

// * Worked example for catalyst/features/007_graphql-api.md: this page is written exactly the
// * way the REST pages are — query composables, no loading refs, no try/catch, inline 422s.
// * The only difference from users.vue is which composables it imports.

const { t } = useI18n();

const editModal = useTemplateRef('editModal');

const { data: users, isLoading, error } = useFetchUsersGql();

const editingUser = ref<User | null>(null);
const userForm = ref({ name: '', email: '', role: 'user' as User['role'] });

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

const { r$ } = useRegle(
  userForm,
  {
    name: labeledRules('common.fields.name', {
      required,
      maxLength: maxLength(255)
    }),
    email: labeledRules('common.fields.email', {
      required,
      email,
      maxLength: maxLength(255)
    })
  },
  { externalErrors: useExternalErrors(() => formErrors.value) }
);

function openEditForm(user: User) {
  editingUser.value = user;
  userForm.value = { name: user.name, email: user.email, role: user.role };
  r$.$reset();
}

function closeEditForm() {
  editingUser.value = null;
}

async function handleSubmit() {
  const { valid } = await r$.$validate();

  if (!valid || !editingUser.value) {
    return;
  }

  // * Partial update: only the fields the admin actually changed go on the wire — omitted
  // * GraphQL variables never reach the resolver, so untouched fields keep their values.
  updateUser({
    id: editingUser.value.id,
    ...changedFields(editingUser.value, userForm.value)
  });
}

// * Move focus into the dialog so Escape and keyboard navigation work without a pointer.
watch(editingUser, async (user) => {
  if (user) {
    await nextTick();
    editModal.value?.focus();
  }
});
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
  max-width: 500px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* * The container is focused programmatically on open; the visible focus ring belongs on the controls inside, not the dialog itself. */
.modal:focus {
  outline: none;
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

.cancel-btn:hover:not(:disabled) {
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

.submit-btn:disabled,
.cancel-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
