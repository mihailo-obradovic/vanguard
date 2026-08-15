<template>
  <div class="forgot-password-container">
    <div class="forgot-password-card">
      <h1 class="forgot-password-title">
        {{ $t('auth.forgotPassword.title') }}
      </h1>

      <p class="forgot-password-hint">
        {{ $t('auth.forgotPassword.hint') }}
      </p>

      <form
        class="forgot-password-form"
        novalidate
        @submit.prevent="handleSubmit"
      >
        <div class="form-group">
          <label for="email" class="form-label">
            {{ $t('common.fields.email') }}
          </label>

          <input
            id="email"
            v-model="form.email"
            type="email"
            class="form-input"
            required
            :disabled="isSending"
          />

          <FieldErrors :errors="r$.email.$errors" />
        </div>

        <button
          type="submit"
          class="submit-btn"
          :disabled="isSending || r$.$invalid"
        >
          {{
            isSending
              ? $t('auth.forgotPassword.submitting')
              : $t('auth.forgotPassword.submit')
          }}
        </button>
      </form>

      <div class="auth-footer">
        <p>
          {{ $t('auth.rememberedPassword') }}
          <NuxtLink to="/login" class="auth-link">
            {{ $t('auth.loginLink') }}
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGeneratePasswordResetEmail } from '@/services/queries/useAuthQueries';

const form = ref({
  email: ''
});

const {
  mutate: sendResetLink,
  isLoading: isSending,
  error: sendError
} = useGeneratePasswordResetEmail({
  errorHandling: { hideValidationToast: true },
  onSuccess: (data) => {
    $toast(data.status, 'success');
    form.value.email = '';
    r$.$reset();
  }
});

const { r$ } = useRegle(
  form,
  {
    ...credentialEmailRules()
  },
  { externalErrors: useExternalErrors(useValidationErrors(sendError)) }
);

async function handleSubmit() {
  const { valid } = await r$.$validate();

  if (valid) {
    sendResetLink(form.value);
  }
}
</script>

<style scoped>
.forgot-password-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.forgot-password-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 32px;
  width: 100%;
  max-width: 400px;
  border: 1px solid #e9ecef;
}

.forgot-password-title {
  text-align: center;
  margin: 0 0 16px 0;
  color: rgb(0, 102, 255);
  font-size: 28px;
  font-weight: 600;
}

.forgot-password-hint {
  text-align: center;
  margin: 0 0 24px 0;
  color: #495057;
  font-size: 14px;
}

.forgot-password-form {
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
