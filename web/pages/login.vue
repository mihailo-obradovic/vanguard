<template>
  <div class="login-container">
    <div class="login-card">
      <h1 class="login-title">Welcome Back</h1>

      <form class="login-form" novalidate @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email" class="form-label">Email</label>

          <input
            id="email"
            v-model="form.email"
            type="email"
            class="form-input"
            required
            :disabled="isLoggingIn"
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
            :disabled="isLoggingIn"
          />

          <FieldErrors :errors="r$.password.$errors" />
        </div>

        <button
          type="submit"
          class="login-btn"
          :disabled="isLoggingIn || r$.$invalid"
        >
          {{ isLoggingIn ? 'Logging in...' : 'Login' }}
        </button>
      </form>

      <div class="auth-footer">
        <p>
          Don't have an account?
          <NuxtLink to="/register" class="auth-link">Register here</NuxtLink>
        </p>

        <p>
          <NuxtLink to="/forgot-password" class="auth-link">
            Forgot your password?
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { email, required } from '@regle/rules';

import { useLogIn } from '@/services/queries/useAuthQueries';

const form = ref({
  email: 'test@example.com',
  password: 'gmaz1234'
});

const {
  mutate: logIn,
  isLoading: isLoggingIn,
  error: loginError
} = useLogIn({
  errorHandling: { hideValidationToast: true },
  onSuccess: () => navigateTo('/home')
});

const { r$ } = useRegle(
  form,
  {
    email: { required, email },
    password: { required }
  },
  { externalErrors: useExternalErrors(useValidationErrors(loginError)) }
);

async function handleLogin() {
  const { valid } = await r$.$validate();

  if (valid) {
    logIn(form.value);
  }
}
</script>

<style scoped>
.login-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.login-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 32px;
  width: 100%;
  max-width: 400px;
  border: 1px solid #e9ecef;
}

.login-title {
  text-align: center;
  margin: 0 0 24px 0;
  color: rgb(0, 102, 255);
  font-size: 28px;
  font-weight: 600;
}

.login-form {
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

.login-btn {
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

.login-btn:hover:not(:disabled) {
  background-color: rgba(0, 102, 255, 0.9);
}

.login-btn:disabled {
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
