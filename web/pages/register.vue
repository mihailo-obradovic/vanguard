<template>
  <AuthCard
    :title="$t('auth.register.title')"
    :submit-label="$t('auth.register.submit')"
    :submitting-label="$t('auth.register.submitting')"
    :submitting="isRegistering"
    :disabled="r$.$invalid"
    @submit="handleRegister"
  >
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

    <template #footer>
      <p>
        {{ $t('auth.register.haveAccount') }}
        <NuxtLink to="/login">{{ $t('auth.loginLink') }}</NuxtLink>
      </p>
    </template>
  </AuthCard>
</template>

<script setup lang="ts">
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
  errorHandling: { suppressToasts: 'validation' },
  onSuccess: () => navigateTo('/home')
});

const { r$ } = useRegle(
  form,
  {
    ...nameRules(),
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
