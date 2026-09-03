<template>
  <AuthCard
    :title="$t('auth.forgotPassword.title')"
    :hint="$t('auth.forgotPassword.hint')"
    :submit-label="$t('auth.forgotPassword.submit')"
    :submitting-label="$t('auth.forgotPassword.submitting')"
    :submitting="isSending"
    :disabled="r$.$invalid"
    @submit="handleSubmit"
  >
    <UIField
      v-model="form.email"
      :label="$t('common.fields.email')"
      :errors="r$.email.$errors"
      type="email"
      required
      :disabled="isSending"
    />

    <template #footer>
      <p>
        {{ $t('auth.rememberedPassword') }}
        <NuxtLink to="/login">{{ $t('auth.loginLink') }}</NuxtLink>
      </p>
    </template>
  </AuthCard>
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
  errorHandling: { suppressToasts: 'validation' },
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
