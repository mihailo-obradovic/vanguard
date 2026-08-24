<template>
  <div class="flex flex-1 items-center justify-center p-4">
    <u-card class="w-full max-w-md">
      <template #header>
        <h1 class="text-center text-xl font-semibold">
          {{ $t('auth.passwordReset.title') }}
        </h1>
      </template>

      <form
        id="password-reset-form"
        class="space-y-4"
        novalidate
        @submit.prevent="handleSubmit"
      >
        <u-form-field
          :label="$t('common.fields.email')"
          :error="r$.email.$errors[0]"
          required
        >
          <u-input
            v-model="form.email"
            type="email"
            autocomplete="email"
            class="w-full"
          />
        </u-form-field>

        <u-form-field
          :label="$t('common.fields.password')"
          :error="r$.password.$errors[0]"
          required
        >
          <u-input
            v-model="form.password"
            type="password"
            autocomplete="new-password"
            class="w-full"
          />
        </u-form-field>

        <u-form-field
          :label="$t('common.fields.passwordConfirmation')"
          :error="r$.password_confirmation.$errors[0]"
          required
        >
          <u-input
            v-model="form.password_confirmation"
            type="password"
            autocomplete="new-password"
            class="w-full"
          />
        </u-form-field>
      </form>

      <template #footer>
        <u-button
          type="submit"
          form="password-reset-form"
          block
          :loading="isResetting"
          :disabled="r$.$invalid"
        >
          {{
            isResetting
              ? $t('auth.passwordReset.submitting')
              : $t('auth.passwordReset.submit')
          }}
        </u-button>
      </template>
    </u-card>
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
    navigateTo('/home');
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

  if (!valid) return;

  resetPassword({
    token: String(route.query.token ?? ''),
    ...form.value
  });
}
</script>
