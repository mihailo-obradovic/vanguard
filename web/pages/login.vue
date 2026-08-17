<template>
  <AuthCard
    :title="$t('auth.login.title')"
    :submit-label="$t('auth.login.submit')"
    :submitting-label="$t('auth.login.submitting')"
    :submitting="isLoggingIn"
    :disabled="r$.$invalid"
    @submit="handleLogin"
  >
    <UIField
      v-model="form.email"
      :label="$t('common.fields.email')"
      :errors="r$.email.$errors"
      type="email"
      required
      :disabled="isLoggingIn"
    />

    <UIField
      v-model="form.password"
      :label="$t('common.fields.password')"
      :errors="r$.password.$errors"
      type="password"
      required
      :disabled="isLoggingIn"
    />

    <template #footer>
      <p>
        {{ $t('auth.login.noAccount') }}
        <NuxtLink to="/register">
          {{ $t('auth.login.registerLink') }}
        </NuxtLink>
      </p>

      <p>
        <NuxtLink to="/forgot-password">
          {{ $t('auth.login.forgotPasswordLink') }}
        </NuxtLink>
      </p>
    </template>
  </AuthCard>
</template>

<script setup lang="ts">
import { required } from '@regle/rules';

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
    ...credentialEmailRules(),
    password: labeledRules('validation.fieldNames.password', { required })
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
