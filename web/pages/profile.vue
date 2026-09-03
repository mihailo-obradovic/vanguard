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
                <RoleBadge :role="user.role" large />
              </div>
            </div>

            <div class="info-item">
              <div class="info-label">
                {{ $t('profile.info.emailVerified') }}
              </div>

              <div class="info-value verification-value">
                <VerificationBadge :verified="!!user.email_verified_at" large>
                  {{
                    user.email_verified_at
                      ? $t('profile.info.verified')
                      : $t('profile.info.notVerified')
                  }}
                </VerificationBadge>

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

    <ProfileFormDialog
      v-if="user"
      :open="showEditForm"
      :user="user"
      :submitting="isSubmittingProfile"
      :server-errors="profileFormErrors"
      @submit="updateProfile"
      @close="closeEditForm"
    />
  </div>
</template>

<script setup lang="ts">
import ProfileFormDialog from '@/components/profile/ProfileFormDialog.vue';

import {
  useRefreshUser,
  useUpdateProfile,
  useResendEmailVerification
} from '@/services/queries/useAuthQueries';

const { t } = useI18n();

const showEditForm = ref(false);

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
  errorHandling: { suppressToasts: 'validation' },
  onSuccess: () => {
    $toast(t('profile.toasts.updated'), 'success');
    closeEditForm();
  }
});

const profileFormErrors = useValidationErrors(updateProfileError);

function openEditForm() {
  if (!user.value) {
    return;
  }

  showEditForm.value = true;
}

function closeEditForm() {
  showEditForm.value = false;
}

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
  background: var(--color-surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow-card);
  border: 1px solid var(--color-border);
  overflow: hidden;
}

.profile-header {
  background-color: var(--color-brand);
  color: var(--color-on-brand);
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
  color: var(--color-brand);
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 24px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--color-border);
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
  color: var(--color-text);
  font-weight: 500;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  color: var(--color-text);
  font-size: 16px;
  font-weight: 500;
  padding: 12px 16px;
  background-color: var(--color-surface-muted);
  border-radius: var(--radius);
  border: 1px solid var(--color-border);
}

.verification-value {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.resend-btn {
  background-color: transparent;
  color: var(--color-brand);
  border: 1px solid var(--color-brand);
  padding: 6px 12px;
  border-radius: var(--radius);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition);
}

.resend-btn:hover:not(:disabled) {
  background-color: var(--color-brand);
  color: var(--color-on-brand);
}

.resend-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.profile-actions {
  display: flex;
  justify-content: center;
  padding-top: 24px;
  border-top: 1px solid var(--color-border);
}

.edit-profile-btn {
  background-color: var(--color-brand);
  color: var(--color-on-brand);
  border: none;
  padding: 12px 24px;
  border-radius: var(--radius);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color var(--transition);
}

.edit-profile-btn:hover {
  background-color: var(--color-brand-hover);
}

.loading-state {
  text-align: center;
  padding: 64px 32px;
  color: var(--color-text-muted);
}

.loading-state p {
  margin: 0;
  font-size: 18px;
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
