<template>
  <div class="register-container">
    <div class="register-card">
      <h1 class="register-title">{{ $t('auth.register.title') }}</h1>

      <form class="register-form" novalidate @submit.prevent="handleRegister">
        <UIField
          v-model="form.name"
          :label="$t('common.fields.name')"
          :errors="r$.name.$errors"
          type="text"
          required
          :disabled="isRegistering"
        />

        <UIField
          v-model="form.email"
          :label="$t('common.fields.email')"
          :errors="r$.email.$errors"
          type="email"
          required
          :disabled="isRegistering"
        />

        <UIField
          v-model="form.password"
          :label="$t('common.fields.password')"
          :errors="r$.password.$errors"
          type="password"
          required
          :disabled="isRegistering"
        />

        <UIField
          v-model="form.password_confirmation"
          :label="$t('common.fields.passwordConfirmation')"
          :errors="r$.password_confirmation.$errors"
          type="password"
          required
          :disabled="isRegistering"
        />

        <button
          type="submit"
          class="register-btn"
          :disabled="isRegistering || r$.$invalid"
        >
          {{
            isRegistering
              ? $t('auth.register.submitting')
              : $t('auth.register.submit')
          }}
        </button>
      </form>

      <div class="auth-footer">
        <p>
          {{ $t('auth.register.haveAccount') }}
          <NuxtLink to="/login" class="auth-link">
            {{ $t('auth.loginLink') }}
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { maxLength, required } from '@regle/rules';

import { useRegister } from '@/services/queries/useAuthQueries';

const form = ref({
  name: '',
  email: '',
  password: '',
  password_confirmation: ''
});

const {
  mutate: register,
  isLoading: isRegistering,
  error: registerError
} = useRegister({
  errorHandling: { hideValidationToast: true },
  onSuccess: () => navigateTo('/home')
});

const { r$ } = useRegle(
  form,
  {
    name: labeledRules('validation.fieldNames.name', {
      required,
      maxLength: maxLength(255)
    }),
    ...accountEmailRules(),
    ...newPasswordRules(() => form.value.password)
  },
  { externalErrors: useExternalErrors(useValidationErrors(registerError)) }
);

async function handleRegister() {
  const { valid } = await r$.$validate();

  if (valid) {
    register(form.value);
  }
}
</script>

<style scoped>
.register-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.register-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 32px;
  width: 100%;
  max-width: 400px;
  border: 1px solid #e9ecef;
}

.register-title {
  text-align: center;
  margin: 0 0 24px 0;
  color: rgb(0, 102, 255);
  font-size: 28px;
  font-weight: 600;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.register-btn {
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

.register-btn:hover:not(:disabled) {
  background-color: rgba(0, 102, 255, 0.9);
}

.register-btn:disabled {
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
