<template>
  <!-- * A column filling `main`, so the table below can take the space that is left rather than growing the page. -->
  <div class="users-container">
    <div class="users-header">
      <h1 class="users-title">{{ $t('users.title') }}</h1>

      <div class="actions-bar">
        <button class="create-btn" @click="openCreateForm">
          {{ $t('users.create') }}
        </button>
      </div>
    </div>

    <div v-if="isPending" class="loading-state">
      <p>{{ $t('users.loading') }}</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ $t('errors.usersLoad', { message: getErrorMessage(error) }) }}</p>
    </div>

    <div v-else class="users-content">
      <div class="users-stats">
        <p>
          {{ $t('users.total') }}
          <span class="stats-number">{{ users.length }}</span>
        </p>
      </div>

      <div class="table-container">
        <table class="users-table">
          <thead>
            <tr>
              <th>{{ $t('users.columns.id') }}</th>
              <th>{{ $t('users.columns.name') }}</th>
              <th>{{ $t('users.columns.email') }}</th>
              <th>{{ $t('users.columns.role') }}</th>
              <th>{{ $t('users.columns.emailVerified') }}</th>
              <th>{{ $t('users.columns.createdAt') }}</th>
              <th>{{ $t('users.columns.actions') }}</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="user in users" :key="user.id" class="user-row">
              <td>{{ user.id }}</td>
              <td class="user-name">{{ user.name }}</td>
              <td class="user-email">{{ user.email }}</td>
              <td><RoleBadge :role="user.role" /></td>
              <td>
                <VerificationBadge :verified="!!user.email_verified_at">
                  {{
                    user.email_verified_at
                      ? $t('users.verified.yes')
                      : $t('users.verified.no')
                  }}
                </VerificationBadge>
              </td>
              <td class="created-date">{{ formatDate(user.created_at) }}</td>
              <td class="actions-cell">
                <button
                  class="edit-btn"
                  :disabled="isDeletingUser === user.id"
                  @click="openEditForm(user)"
                >
                  {{ $t('common.actions.edit') }}
                </button>

                <button
                  class="delete-btn"
                  :disabled="isDeletingUser === user.id"
                  @click="confirmDelete(user)"
                >
                  {{
                    isDeletingUser === user.id
                      ? $t('common.actions.deleting')
                      : $t('common.actions.delete')
                  }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <UserFormDialog
      :open="showUserForm"
      :user="userBeingEdited"
      :submitting="isSubmittingUser"
      :server-errors="userFormErrors"
      @create="createUser"
      @update="handleUpdateUser"
      @close="closeUserForm"
    />

    <UIDialog
      :open="!!userToDelete"
      :title="$t('users.delete.title')"
      narrow
      danger
      @close="cancelDelete"
    >
      <div class="delete-confirmation">
        <!-- * `scope="global"`: the Translation component resolves against its PARENT's scope by default, and its parent here is UIDialog (slot content), which enables no scope of its own. Without this it warns and falls back to global anyway — this says so out loud. -->
        <i18n-t keypath="users.delete.confirm" tag="p" scope="global">
          <template #name>
            <strong>"{{ userToDelete?.name }}"</strong>
          </template>
        </i18n-t>

        <p class="warning-text">{{ $t('users.delete.warning') }}</p>
      </div>

      <UIDialogActions>
        <button class="cancel-btn" :disabled="isDeleting" @click="cancelDelete">
          {{ $t('common.actions.cancel') }}
        </button>

        <button
          class="confirm-delete-btn"
          :disabled="isDeleting"
          @click="handleDelete"
        >
          {{
            isDeleting
              ? $t('common.actions.deleting')
              : $t('users.delete.submit')
          }}
        </button>
      </UIDialogActions>
    </UIDialog>
  </div>
</template>

<script setup lang="ts">
import UserFormDialog from '@/components/users/UserFormDialog.vue';

import {
  useFetchUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser
} from '@/services/queries/useUserQueries';
import type { User } from '@/types/auth';
import type { UpdateUserForm } from '@/types/user';

const { t } = useI18n();

const { data: usersResponse, isPending, error } = useFetchUsers();

const userToDelete = ref<User | null>(null);

// * The form's subject: a user to edit, or `null` to create one. It outlives the open flag, so nothing has to be cleared on close.
const showUserForm = ref(false);
const userBeingEdited = ref<User | null>(null);

const {
  mutate: createUser,
  isLoading: isCreatingUser,
  error: createUserError
} = useCreateUser({
  errorHandling: { suppressToasts: 'validation' },
  onSuccess: (newUser) => {
    $toast(t('users.toasts.created', { name: newUser.name }), 'success');
    closeUserForm();
  }
});

const {
  mutate: updateUser,
  isLoading: isUpdatingUser,
  error: updateUserError
} = useUpdateUser({
  errorHandling: { suppressToasts: 'validation' },
  onSuccess: (updatedUser) => {
    $toast(t('users.toasts.updated', { name: updatedUser.name }), 'success');
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
      t('users.toasts.deleted', { name: userToDelete.value?.name ?? '' }),
      'success'
    );
  },
  onSettled: () => {
    userToDelete.value = null;
  }
});

const userFormErrors = useValidationErrors(
  computed(() =>
    userBeingEdited.value ? updateUserError.value : createUserError.value
  )
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

// * Create/Edit form functions
function openCreateForm() {
  userBeingEdited.value = null;
  showUserForm.value = true;
}

function openEditForm(user: User) {
  userBeingEdited.value = user;
  showUserForm.value = true;
}

function closeUserForm() {
  showUserForm.value = false;
}

function handleUpdateUser(id: number, userData: UpdateUserForm) {
  updateUser({ id, userData });
}
</script>

<style scoped>
.users-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.users-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.users-title {
  color: var(--color-brand);
  margin: 0;
  font-size: 32px;
  font-weight: 600;
}

.actions-bar {
  display: flex;
  gap: 16px;
}

.create-btn {
  background-color: var(--color-brand);
  color: var(--color-on-brand);
  border: none;
  padding: 8px 16px;
  border-radius: var(--radius);
  font-weight: 500;
  cursor: pointer;
  transition: background-color var(--transition);
  font-size: 14px;
}

.create-btn:hover {
  background-color: var(--color-brand-hover);
}

.loading-state,
.error-state {
  text-align: center;
  padding: 32px;
  background: var(--color-surface);
  border-radius: var(--radius);
  border: 1px solid var(--color-border);
}

.error-state {
  color: var(--color-danger);
  background-color: var(--color-danger-surface);
  border-color: var(--color-danger-surface-border);
}

.users-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.users-stats {
  margin-bottom: 16px;
  flex-shrink: 0;
}

.users-stats p {
  color: var(--color-text);
  margin: 0;
  font-size: 16px;
}

.stats-number {
  font-weight: 600;
  color: var(--color-brand);
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

.user-row:hover {
  background-color: var(--color-surface-muted);
}

.user-name {
  font-weight: 500;
  color: var(--color-text);
}

.user-email {
  color: var(--color-text-muted);
}

.created-date {
  color: var(--color-text-muted);
  font-size: 13px;
}

.actions-cell {
  display: flex;
  gap: 8px;
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

.edit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.delete-btn {
  background-color: var(--color-danger);
  color: var(--color-on-brand);
  border: none;
  padding: 6px 12px;
  border-radius: var(--radius);
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: background-color var(--transition);
}

.delete-btn:hover:not(:disabled) {
  background-color: var(--color-danger-hover);
}

.delete-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.delete-confirmation p {
  margin: 0 0 8px 0;
  color: var(--color-text);
}

.warning-text {
  color: var(--color-danger);
  font-size: 14px;
  font-style: italic;
}

.cancel-btn {
  background-color: var(--color-secondary);
  color: var(--color-on-brand);
  border: none;
  padding: 8px 16px;
  border-radius: var(--radius);
  font-weight: 500;
  cursor: pointer;
  transition: background-color var(--transition);
}

.cancel-btn:hover {
  background-color: var(--color-secondary-hover);
}

.confirm-delete-btn {
  background-color: var(--color-danger);
  color: var(--color-on-brand);
  border: none;
  padding: 8px 16px;
  border-radius: var(--radius);
  font-weight: 500;
  cursor: pointer;
  transition: background-color var(--transition);
}

.confirm-delete-btn:hover:not(:disabled) {
  background-color: var(--color-danger-hover);
}

.cancel-btn:disabled,
.confirm-delete-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
