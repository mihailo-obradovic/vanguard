<template>
  <div class="profile-container">
    <div class="profile-card">
      <div class="profile-header">
        <h1 class="profile-title">{{ $t('profile.title') }}</h1>
      </div>

      <div v-if="user" class="profile-content">
        <div class="profile-section">
          <h2 class="section-title">
            {{ $t('profile.info.personalInformation') }}
          </h2>

          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">{{ $t('common.fields.name') }}</div>

              <div class="info-value">{{ user.name }}</div>
            </div>

            <div class="info-item">
              <div class="info-label">{{ $t('common.fields.email') }}</div>

              <div class="info-value">{{ user.email }}</div>
            </div>

            <div class="info-item">
              <div class="info-label">{{ $t('common.fields.role') }}</div>

              <div class="info-value">
                <span class="role-badge" :class="user.role">
                  {{ $t(`users.roles.${user.role}`) }}
                </span>
              </div>
            </div>

            <div class="info-item">
              <div class="info-label">
                {{ $t('profile.info.emailVerified') }}
              </div>

              <div class="info-value verification-value">
                <span
                  class="verification-badge"
                  :class="{ verified: user.email_verified_at }"
                >
                  {{
                    user.email_verified_at
                      ? $t('profile.info.verified')
                      : $t('profile.info.notVerified')
                  }}
                </span>

                <button
                  v-if="!user.email_verified_at"
                  type="button"
                  class="resend-btn"
                  :disabled="isResending"
                  @click="resendVerification()"
                >
                  {{
                    isResending
                      ? $t('profile.info.resending')
                      : $t('profile.info.resend')
                  }}
                </button>
              </div>
            </div>

            <div class="info-item">
              <div class="info-label">{{ $t('profile.info.memberSince') }}</div>

              <div class="info-value">{{ formatDate(user.created_at) }}</div>
            </div>

            <div class="info-item">
              <div class="info-label">{{ $t('profile.info.lastUpdated') }}</div>

              <div class="info-value">{{ formatDate(user.updated_at) }}</div>
            </div>
          </div>
        </div>

        <div class="profile-actions">
          <button class="edit-profile-btn" @click="openEditForm">
            {{ $t('profile.edit') }}
          </button>
        </div>
      </div>

      <div v-else class="loading-state">
        <p>{{ $t('profile.loading') }}</p>
      </div>
    </div>

    <!-- * Edit Profile Form -->
    <div v-if="showEditForm" class="modal-overlay" @click="closeEditForm">
      <div
        ref="editProfileModal"
        class="modal form-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-title"
        tabindex="-1"
        @click.stop
        @keydown.esc="closeEditForm"
      >
        <div class="modal-header">
          <h3 id="edit-profile-title" class="modal-title">
            {{ $t('profile.edit') }}
          </h3>
        </div>

        <form
          class="profile-form"
          novalidate
          @submit.prevent="handleSubmitProfile"
        >
          <div class="form-group">
            <label for="name" class="form-label">
              {{ $t('common.fields.name') }}
            </label>

            <input
              id="name"
              v-model="profileForm.name"
              type="text"
              class="form-input"
              required
              :disabled="isSubmittingProfile"
            />

            <FieldErrors :errors="r$.name.$errors" />
          </div>

          <div class="form-group">
            <label for="email" class="form-label">
              {{ $t('common.fields.email') }}
            </label>

            <input
              id="email"
              v-model="profileForm.email"
              type="email"
              class="form-input"
              required
              :disabled="isSubmittingProfile"
            />

            <FieldErrors :errors="r$.email.$errors" />
          </div>

          <div class="form-group">
            <label for="current_password" class="form-label">
              {{ $t('profile.form.currentPassword') }}
            </label>

            <input
              id="current_password"
              v-model="profileForm.current_password"
              type="password"
              class="form-input"
              :required="!!profileForm.password"
              :disabled="isSubmittingProfile"
            />

            <FieldErrors :errors="r$.current_password.$errors" />
          </div>

          <div class="form-group">
            <label for="password" class="form-label">
              {{ $t('profile.form.newPassword') }}
            </label>

            <input
              id="password"
              v-model="profileForm.password"
              type="password"
              class="form-input"
              :disabled="isSubmittingProfile"
            />

            <FieldErrors :errors="r$.password.$errors" />
          </div>

          <div class="form-group">
            <label for="password_confirmation" class="form-label">
              {{ $t('profile.form.confirmNewPassword') }}
            </label>

            <input
              id="password_confirmation"
              v-model="profileForm.password_confirmation"
              type="password"
              class="form-input"
              :required="!!profileForm.password"
              :disabled="isSubmittingProfile"
            />

            <FieldErrors :errors="r$.password_confirmation.$errors" />
          </div>

          <div class="modal-actions">
            <button
              type="button"
              class="cancel-btn"
              :disabled="isSubmittingProfile"
              @click="closeEditForm"
            >
              {{ $t('common.actions.cancel') }}
            </button>

            <button
              type="submit"
              class="submit-btn"
              :disabled="isSubmittingProfile || r$.$invalid"
            >
              {{
                isSubmittingProfile
                  ? $t('common.actions.saving')
                  : $t('profile.form.submit')
              }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { email, maxLength, required, requiredIf } from '@regle/rules';

import {
  useRefreshUser,
  useUpdateProfile,
  useResendEmailVerification
} from '@/services/queries/useAuthQueries';
import type { ProfileForm } from '@/types/user';

const { t } = useI18n();

// * Edit form state
const editProfileModal = useTemplateRef('editProfileModal');
const showEditForm = ref(false);
const profileForm = ref({
  name: '',
  email: '',
  current_password: '',
  password: '',
  password_confirmation: ''
});

const route = useRoute();
const router = useRouter();

const { user } = storeToRefs(useAuthStore());

const { mutate: refreshUser } = useRefreshUser({
  onSuccess: () => {
    $toast(t('profile.toasts.emailVerified'), 'success');
    router.replace({ query: {} });
  }
});

const { mutate: resendVerification, isLoading: isResending } =
  useResendEmailVerification({
    onSuccess: () => {
      $toast(t('profile.toasts.verificationSent'), 'success');
    }
  });

const {
  mutate: updateProfile,
  isLoading: isSubmittingProfile,
  error: updateProfileError
} = useUpdateProfile({
  errorHandling: { hideValidationToast: true },
  onSuccess: () => {
    $toast(t('profile.toasts.updated'), 'success');
    closeEditForm();
  }
});

// * Mirrors ProfileUpdateRequest: the current password is only needed when setting a new one.
const { r$ } = useRegle(
  profileForm,
  {
    name: { required, maxLength: maxLength(255) },
    email: { required, email, maxLength: maxLength(255) },
    current_password: {
      requiredIf: requiredIf(() => !!profileForm.value.password)
    },
    ...newPasswordRules(() => profileForm.value.password, true)
  },
  { externalErrors: useExternalErrors(useValidationErrors(updateProfileError)) }
);

function openEditForm() {
  if (!user.value) return;

  profileForm.value = {
    name: user.value.name,
    email: user.value.email,
    current_password: '',
    password: '',
    password_confirmation: ''
  };
  r$.$reset();
  showEditForm.value = true;
}

function closeEditForm() {
  showEditForm.value = false;
  profileForm.value = {
    name: '',
    email: '',
    current_password: '',
    password: '',
    password_confirmation: ''
  };
  r$.$reset();
}

async function handleSubmitProfile() {
  const { valid } = await r$.$validate();

  if (!valid) {
    return;
  }

  const updateData: ProfileForm = {
    name: profileForm.value.name,
    email: profileForm.value.email,
    current_password: profileForm.value.current_password
  };

  // * Only include password if provided
  if (profileForm.value.password) {
    updateData.password = profileForm.value.password;
    updateData.password_confirmation = profileForm.value.password_confirmation;
  }

  updateProfile(updateData);
}

// * Move focus into the dialog so Escape and keyboard navigation work without a pointer.
watch(showEditForm, async (isOpen) => {
  if (isOpen) {
    await nextTick();
    editProfileModal.value?.focus();
  }
});

onMounted(() => {
  if (route.query.verified === '1') {
    refreshUser();
  }
});
</script>

<style scoped>
.profile-container {
  max-width: 800px;
  margin: 0 auto;
}

.profile-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
  overflow: hidden;
}

.profile-header {
  background-color: rgb(0, 102, 255);
  color: white;
  padding: 24px;
  text-align: center;
}

.profile-title {
  margin: 0;
  font-size: 32px;
  font-weight: 600;
}

.profile-content {
  padding: 32px;
}

.profile-section {
  margin-bottom: 32px;
}

.section-title {
  color: rgb(0, 102, 255);
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 24px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #e9ecef;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-label {
  color: #495057;
  font-weight: 500;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  color: #495057;
  font-size: 16px;
  font-weight: 500;
  padding: 12px 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.role-badge {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.role-badge.admin {
  background-color: #dc3545;
  color: white;
}

.role-badge.user {
  background-color: #28a745;
  color: white;
}

.verification-value {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.verification-badge {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

.resend-btn {
  background-color: transparent;
  color: rgb(0, 102, 255);
  border: 1px solid rgb(0, 102, 255);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
}

.resend-btn:hover:not(:disabled) {
  background-color: rgb(0, 102, 255);
  color: white;
}

.resend-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.verification-badge.verified {
  background-color: #28a745;
  color: white;
}

.verification-badge:not(.verified) {
  background-color: #ffc107;
  color: #000;
}

.profile-actions {
  display: flex;
  justify-content: center;
  padding-top: 24px;
  border-top: 1px solid #e9ecef;
}

.edit-profile-btn {
  background-color: rgb(0, 102, 255);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.25s ease;
}

.edit-profile-btn:hover {
  background-color: rgba(0, 102, 255, 0.9);
}

.loading-state {
  text-align: center;
  padding: 64px 32px;
  color: #6c757d;
}

.loading-state p {
  margin: 0;
  font-size: 18px;
}

/* * Modal Styles */
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

/* * The container is focused programmatically on open; the visible focus ring belongs on the controls inside, not the dialog itself. */
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

.profile-form {
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

.form-input {
  padding: 8px 16px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.25s ease;
  background-color: white;
}

.form-input:focus {
  outline: none;
  border-color: rgb(0, 102, 255);
  box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.1);
}

.form-input:disabled {
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

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }

  .profile-content {
    padding: 24px;
  }

  .profile-header {
    padding: 20px;
  }

  .profile-title {
    font-size: 28px;
  }
}
</style>
