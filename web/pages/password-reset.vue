<template>
  <FormCard
    :confirm-disabled="r$.$invalid"
    :loading="isResetting"
    :title="$t('auth.passwordReset.title')"
    width="450px"
    @cancel="handleCancel"
    @confirm="handleConfirm"
  >
    <input type="hidden" name="token" :value="form.token" />

    <v-text-field
      v-model="form.email"
      :error-messages="r$.email.$errors"
      :label="$t('common.fields.email')"
      type="email"
      readonly
    />

    <PasswordField
      v-model="form.password"
      v-model:visible="showPassword"
      :error-messages="r$.password.$errors"
      :label="$t('common.fields.password')"
      required
    />

    <PasswordField
      v-model="form.password_confirmation"
      v-model:visible="showPassword"
      :error-messages="r$.password_confirmation.$errors"
      :label="$t('common.fields.passwordConfirmation')"
      required
    />
  </FormCard>
</template>

<script setup lang="ts">
import { required } from '@regle/rules';

import { useResetPassword } from '@/services/queries/useAuthQueries';

definePageMeta({
  layout: 'empty'
});

const route = useRoute();

const showPassword = ref(false);

const form = ref({
  token: '',
  email: '',
  password: '',
  password_confirmation: ''
});

onMounted(() => {
  form.value.token = String(route.query.token ?? '');

  form.value.email = String(route.query.email ?? '');
});

const {
  mutate: resetPassword,
  isLoading: isResetting,
  error: resetError
} = useResetPassword({
  errorHandling: { hideValidationToast: true },
  onSuccess: (data) => {
    $toast(data.status, 'success');
    navigateTo('/');
  }
});

const externalErrors = useExternalErrors(useValidationErrors(resetError));

// * An expired/invalid reset token comes back as a 422 on the email field, so it surfaces under the readonly email input.
const { r$ } = useRegle(
  form,
  {
    token: { required },
    ...credentialEmailRules(),
    ...newPasswordRules(() => form.value.password)
  },
  { externalErrors }
);

function handleCancel() {
  navigateTo('/');
}

async function handleConfirm() {
  const { valid } = await r$.$validate();

  if (valid) {
    resetPassword(form.value);
  }
}
</script>
