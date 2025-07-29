<template>
  <div class="profile-container">
    <div class="profile-card">
      <div class="profile-header">
        <h1 class="profile-title">My Profile</h1>
      </div>

      <div v-if="user" class="profile-content">
        <div class="profile-section">
          <h2 class="section-title">Personal Information</h2>

          <div class="info-grid">
            <div class="info-item">
              <label class="info-label">Name</label>
              <div class="info-value">{{ user.name }}</div>
            </div>

            <div class="info-item">
              <label class="info-label">Email</label>
              <div class="info-value">{{ user.email }}</div>
            </div>

            <div class="info-item">
              <label class="info-label">Role</label>
              <div class="info-value">
                <span class="role-badge" :class="user.role">
                  {{ user.role }}
                </span>
              </div>
            </div>

            <div class="info-item">
              <label class="info-label">Email Verified</label>
              <div class="info-value">
                <span
                  class="verification-badge"
                  :class="{ verified: user.email_verified_at }"
                >
                  {{ user.email_verified_at ? 'Verified' : 'Not Verified' }}
                </span>
              </div>
            </div>

            <div class="info-item">
              <label class="info-label">Member Since</label>
              <div class="info-value">{{ formatDate(user.created_at) }}</div>
            </div>

            <div class="info-item">
              <label class="info-label">Last Updated</label>
              <div class="info-value">{{ formatDate(user.updated_at) }}</div>
            </div>
          </div>
        </div>

        <div class="profile-actions">
          <button class="edit-profile-btn" @click="openEditForm">
            Edit Profile
          </button>
        </div>
      </div>

      <div v-else class="loading-state">
        <p>Loading profile...</p>
      </div>
    </div>

    <!-- Edit Profile Form -->
    <div v-if="showEditForm" class="modal-overlay" @click="closeEditForm">
      <div class="modal form-modal" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">Edit Profile</h3>
        </div>

        <form class="profile-form" @submit.prevent="handleSubmitProfile">
          <div class="form-group">
            <label for="name" class="form-label">Name</label>
            <input
              id="name"
              v-model="profileForm.name"
              type="text"
              class="form-input"
              required
              :disabled="isSubmittingProfile"
            />
          </div>

          <div class="form-group">
            <label for="email" class="form-label">Email</label>
            <input
              id="email"
              v-model="profileForm.email"
              type="email"
              class="form-input"
              required
              :disabled="isSubmittingProfile"
            />
          </div>

          <div class="form-group">
            <label for="current_password" class="form-label">
              Current Password (required to save changes)
            </label>
            <input
              id="current_password"
              v-model="profileForm.current_password"
              type="password"
              class="form-input"
              required
              :disabled="isSubmittingProfile"
            />
          </div>

          <div class="form-group">
            <label for="password" class="form-label">
              New Password (leave empty to keep current)
            </label>
            <input
              id="password"
              v-model="profileForm.password"
              type="password"
              class="form-input"
              :disabled="isSubmittingProfile"
            />
          </div>

          <div class="form-group">
            <label for="password_confirmation" class="form-label">
              Confirm New Password (required if changing password)
            </label>
            <input
              id="password_confirmation"
              v-model="profileForm.password_confirmation"
              type="password"
              class="form-input"
              :required="!!profileForm.password"
              :disabled="isSubmittingProfile"
            />
          </div>

          <div class="modal-actions">
            <button
              type="button"
              class="cancel-btn"
              :disabled="isSubmittingProfile"
              @click="closeEditForm"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="submit-btn"
              :disabled="isSubmittingProfile"
            >
              {{ isSubmittingProfile ? 'Saving...' : 'Update Profile' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { updateUser } from '@/services/user.api';
import type { UpdateUserForm } from '@/types/user';

const { user } = storeToRefs(useAuthStore());
const { updateUserInStore } = useAuthStore();

// Edit form state
const showEditForm = ref(false);
const isSubmittingProfile = ref(false);
const profileForm = ref({
  name: '',
  email: '',
  current_password: '',
  password: '',
  password_confirmation: ''
});

function formatDate(dateString: string) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function openEditForm() {
  if (!user.value) return;

  profileForm.value = {
    name: user.value.name,
    email: user.value.email,
    current_password: '',
    password: '',
    password_confirmation: ''
  };
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
}

async function handleSubmitProfile() {
  if (
    !user.value ||
    !profileForm.value.name ||
    !profileForm.value.email ||
    !profileForm.value.current_password
  ) {
    $toast('Please fill in all required fields', 'error');
    return;
  }

  // Validate password confirmation
  if (
    profileForm.value.password &&
    profileForm.value.password !== profileForm.value.password_confirmation
  ) {
    $toast('Password confirmation does not match', 'error');
    return;
  }

  try {
    isSubmittingProfile.value = true;

    const updateData: UpdateUserForm = {
      name: profileForm.value.name,
      email: profileForm.value.email,
      current_password: profileForm.value.current_password
    };

    // Only include password if provided
    if (profileForm.value.password) {
      updateData.password = profileForm.value.password;
      updateData.password_confirmation =
        profileForm.value.password_confirmation;
    }

    const updatedUser = await updateUser(user.value.id, updateData);

    // Update user in store
    updateUserInStore(updatedUser);

    $toast('Profile updated successfully', 'success');
    closeEditForm();
  } catch (err: any) {
    $toast(err?.data?.message || 'Failed to update profile', 'error');
  } finally {
    isSubmittingProfile.value = false;
  }
}
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

.verification-badge {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
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

/* Modal Styles */
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
