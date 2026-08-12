<template>
  <div class="password-reset-container">
    <div class="password-reset-card">
      <h1 class="password-reset-title">Reset Password</h1>

      <form
        class="password-reset-form"
        novalidate
        @submit.prevent="handleSubmit"
      >
        <div class="form-group">
          <label for="email" class="form-label">Email</label>

          <input
            id="email"
            v-model="form.email"
            type="email"
            class="form-input"
            required
            :disabled="isResetting"
          />

          <FieldErrors :errors="r$.email.$errors" />
        </div>

        <div class="form-group">
          <label for="password" class="form-label">New Password</label>

          <input
            id="password"
            v-model="form.password"
            type="password"
            class="form-input"
            required
            :disabled="isResetting"
          />

          <FieldErrors :errors="r$.password.$errors" />
        </div>

        <div class="form-group">
          <label for="password_confirmation" class="form-label">
            Confirm New Password
          </label>

          <input
            id="password_confirmation"
            v-model="form.password_confirmation"
            type="password"
            class="form-input"
            required
            :disabled="isResetting"
          />

          <FieldErrors :errors="r$.password_confirmation.$errors" />
        </div>

        <button
          type="submit"
          class="submit-btn"
          :disabled="isResetting || r$.$invalid"
        >
          {{ isResetting ? 'Resetting...' : 'Reset Password' }}
        </button>
      </form>

      <div class="auth-footer">
        <p>
          Remembered your password?
          <NuxtLink to="/login" class="auth-link">Login here</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { email, required } from '@regle/rules';

import { useResetPassword } from '@/services/queries/useAuthQueries';

const route = useRoute();

const form = ref({
  email: String(route.query.email ?? ''),
  password: '',
  password_confirmation: ''
});

const {
  mutate: resetPassword,
  isLoading: isResetting,
  error: resetError
} = useResetPassword({
  errorHandling: { hideValidationToast: true },
  onSuccess: (data) => {
    $toast(data.status, 'success');
    navigateTo('/login');
  }
});

// * An expired/invalid reset token comes back as a 422 on the email field, so it surfaces under the email input.
const { r$ } = useRegle(
  form,
  {
    email: { required, email },
    ...newPasswordRules(() => form.value.password)
  },
  { externalErrors: useExternalErrors(useValidationErrors(resetError)) }
);

async function handleSubmit() {
  const { valid } = await r$.$validate();

  if (valid) {
    resetPassword({
      token: String(route.params.token ?? ''),
      ...form.value
    });
  }
}
</script>

<style scoped>
.password-reset-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.password-reset-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 32px;
  width: 100%;
  max-width: 400px;
  border: 1px solid #e9ecef;
}

.password-reset-title {
  text-align: center;
  margin: 0 0 24px 0;
  color: rgb(0, 102, 255);
  font-size: 28px;
  font-weight: 600;
}

.password-reset-form {
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

.submit-btn {
  background-color: rgb(0, 102, 255);
  color: white;
  border: none;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.25s ease;
  margin-top: 8px;
}

.submit-btn:hover:not(:disabled) {
  background-color: rgba(0, 102, 255, 0.9);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-footer {
  text-align: center;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e9ecef;
}

.auth-footer p {
  margin: 0;
  color: #495057;
}

.auth-link {
  color: rgb(0, 102, 255);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.25s ease;
}

.auth-link:hover {
  color: rgba(0, 102, 255, 0.8);
  text-decoration: underline;
}
</style>
