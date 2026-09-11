<template>
  <AuthCard
    :title="$t('auth.passwordReset.title')"
    :submit-label="$t('auth.passwordReset.submit')"
    :submitting-label="$t('auth.passwordReset.submitting')"
    :submitting="isResetting"
    :disabled="r$.$invalid"
    @submit="handleSubmit"
  >
    <Field :data-invalid="emailErrors.length > 0">
      <FieldLabel :for="emailId">{{ $t('common.fields.email') }}</FieldLabel>

      <Input
        :id="emailId"
        v-model="form.email"
        type="email"
        required
        :disabled="isResetting"
        :aria-invalid="emailErrors.length > 0 || undefined"
        :aria-describedby="
          emailErrors.length > 0 ? `${emailId}-error` : undefined
        "
      />

      <FieldError :id="`${emailId}-error`" :errors="emailErrors" />
    </Field>

    <Field :data-invalid="passwordErrors.length > 0">
      <FieldLabel :for="passwordId">
        {{ $t('common.fields.password') }}
      </FieldLabel>

      <Input
        :id="passwordId"
        v-model="form.password"
        type="password"
        required
        :disabled="isResetting"
        :aria-invalid="passwordErrors.length > 0 || undefined"
        :aria-describedby="
          passwordErrors.length > 0 ? `${passwordId}-error` : undefined
        "
      />

      <FieldError :id="`${passwordId}-error`" :errors="passwordErrors" />
    </Field>

    <Field :data-invalid="confirmationErrors.length > 0">
      <FieldLabel :for="confirmationId">
        {{ $t('common.fields.passwordConfirmation') }}
      </FieldLabel>

      <Input
        :id="confirmationId"
        v-model="form.password_confirmation"
        type="password"
        required
        :disabled="isResetting"
        :aria-invalid="confirmationErrors.length > 0 || undefined"
        :aria-describedby="
          confirmationErrors.length > 0 ? `${confirmationId}-error` : undefined
        "
      />

      <FieldError
        :id="`${confirmationId}-error`"
        :errors="confirmationErrors"
      />
    </Field>

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
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

// * Generated rather than written, so no two forms on a page can collide on an `id` and the
// * `for`/`id` pair cannot drift apart.
const emailId = useId();
const passwordId = useId();
const confirmationId = useId();

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

const emailErrors = computed(() => r$.email.$errors);
const passwordErrors = computed(() => r$.password.$errors);
const confirmationErrors = computed(() => r$.password_confirmation.$errors);

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
