<template>
  <CardDialog
    v-model="dialog"
    :confirm-disabled="r$.$invalid"
    :loading="loading"
    :title="$t('auth.login.title')"
    @cancel="handleCancel"
    @confirm="handleConfirm"
    @after-leave="handleAfterLeave"
  >
    <v-text-field
      v-model="form.email"
      :error-messages="r$.email.$errors"
      :label="$t('common.fields.email')"
      type="email"
      required
    />

    <PasswordField
      v-model="form.password"
      :error-messages="r$.password.$errors"
      :label="$t('common.fields.password')"
      required
    />

    <GapContainer column gap="1">
      <LinkButton @click="handleForgotPasswordClick">
        {{ $t('auth.login.forgotPasswordLink') }}
      </LinkButton>

      <LinkButton @click="handleRegisterClick">
        {{ $t('auth.login.noAccount') }} {{ $t('auth.login.registerLink') }}
      </LinkButton>
    </GapContainer>
  </CardDialog>
</template>

<script setup lang="ts">
import { required } from '@regle/rules';

import type { Credentials } from '@/types/auth';

// ! Stryker instruments this block with locally declared coverage helpers, and a compiler
// ! macro is hoisted out of setup() — referencing them there is a compile error, not a
// ! warning. The defaults inside go unmutated as a result (`catalyst/operations.md`).
// Stryker disable all
const props = withDefaults(
  defineProps<{
    loading?: boolean;
    serverErrors?: Record<string, string[]>;
  }>(),
  { loading: false, serverErrors: () => ({}) }
);

const emit = defineEmits<{
  confirm: [form: Credentials];
  'forgot-password-click': [];
  'register-click': [];
}>();

const dialog = defineModel<boolean>({ required: true });
// Stryker restore all

const form = ref<Credentials>({
  email: 'test@example.com',
  password: 'gmaz1234'
});

const externalErrors = useExternalErrors(() => props.serverErrors);

const { r$ } = useRegle(
  form,
  {
    ...credentialEmailRules(),
    // * Not `newPasswordRules` — this password is being checked, not set, so the 8–255 bounds are the server's business and a stale short password must still be able to sign in.
    password: labeledRules('validation.fieldNames.password', { required })
  },
  { externalErrors }
);

const { handleCancel, handleConfirm, handleAfterLeave } = useDialogForm(
  dialog,
  r$,
  { form, onSubmit: (values) => emit('confirm', values) }
);

function handleForgotPasswordClick() {
  dialog.value = false;

  emit('forgot-password-click');
}

function handleRegisterClick() {
  dialog.value = false;

  emit('register-click');
}
</script>
