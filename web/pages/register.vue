<template>
  <div class="register-container">
    <div class="register-card">
      <h1 class="register-title">Create Account</h1>

      <form class="register-form" novalidate @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="name" class="form-label">Name</label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            class="form-input"
            required
            :disabled="isRegistering"
          />

          <FieldErrors :errors="r$.name.$errors" />
        </div>

        <div class="form-group">
          <label for="email" class="form-label">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            class="form-input"
            required
            :disabled="isRegistering"
          />

          <FieldErrors :errors="r$.email.$errors" />
        </div>

        <div class="form-group">
          <label for="password" class="form-label">Password</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            class="form-input"
            required
            :disabled="isRegistering"
          />

          <FieldErrors :errors="r$.password.$errors" />
        </div>

        <div class="form-group">
          <label for="password_confirmation" class="form-label">
            Password Confirmation
          </label>
          <input
            id="password_confirmation"
            v-model="form.password_confirmation"
            type="password"
            class="form-input"
            required
            :disabled="isRegistering"
          />

          <FieldErrors :errors="r$.password_confirmation.$errors" />
        </div>

        <button
          type="submit"
          class="register-btn"
          :disabled="isRegistering || r$.$invalid"
        >
          {{ isRegistering ? 'Registering...' : 'Register' }}
        </button>
      </form>

      <div class="auth-footer">
        <p>
          Already have an account?
          <NuxtLink to="/login" class="auth-link">Login here</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRegle } from '@regle/core';
import { email, maxLength, minLength, required, sameAs } from '@regle/rules';

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
    name: { required, maxLength: maxLength(255) },
    email: { required, email, maxLength: maxLength(255) },
    password: { required, minLength: minLength(8) },
    password_confirmation: {
      required,
      sameAs: sameAs(() => form.value.password, 'password')
    }
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

.form-input:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
  opacity: 0.7;
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
