<template>
  <AuthCard
    :title="$t('auth.passwordReset.title')"
    :submit-label="$t('auth.passwordReset.submit')"
    :submitting-label="$t('auth.passwordReset.submitting')"
    :submitting="isResetting"
    :disabled="r$.$invalid"
    @submit="handleSubmit"
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

    <template #footer>
      <p>
        {{ $t('auth.rememberedPassword') }}
        <!-- * There is no /login route to link to any more — login is a dialog opened from
             the layout's nav — so this sends the user to the page that has it. -->
        <NuxtLink to="/">{{ $t('auth.loginLink') }}</NuxtLink>
      </p>
    </template>
  </AuthCard>
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
  errorHandling: { suppressToasts: 'validation' },
  onSuccess: (data) => {
    $toast(data.status, 'success');
    navigateTo('/');
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
      token: String(route.query.token ?? ''),
      ...form.value
    });
  }
}
</script>
