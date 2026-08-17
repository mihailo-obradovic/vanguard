<template>
  <div class="password-reset-container">
    <div class="password-reset-card">
      <h1 class="password-reset-title">{{ $t('auth.passwordReset.title') }}</h1>

      <form
        class="password-reset-form"
        novalidate
        @submit.prevent="handleSubmit"
      >
        <UIField
          v-model="form.email"
          :label="$t('common.fields.email')"
          :errors="r$.email.$errors"
          type="email"
          required
          :disabled="isResetting"
        />

        <UIField
          v-model="form.password"
          :label="$t('common.fields.password')"
          :errors="r$.password.$errors"
          type="password"
          required
          :disabled="isResetting"
        />

        <UIField
          v-model="form.password_confirmation"
          :label="$t('common.fields.passwordConfirmation')"
          :errors="r$.password_confirmation.$errors"
          type="password"
          required
          :disabled="isResetting"
        />

        <button
          type="submit"
          class="submit-btn"
          :disabled="isResetting || r$.$invalid"
        >
          {{
            isResetting
              ? $t('auth.passwordReset.submitting')
              : $t('auth.passwordReset.submit')
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
    ...credentialEmailRules(),
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
