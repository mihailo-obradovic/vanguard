<template>
  <CardDialog
    v-model="dialog"
    :confirm-disabled="r$.$invalid"
    :loading="loading"
    :title="$t('auth.register.title')"
    @cancel="handleCancel"
    @confirm="handleConfirm"
    @after-leave="handleAfterLeave"
  >
    <v-text-field
      v-model="form.name"
      :error-messages="r$.name.$errors"
      :label="$t('common.fields.name')"
      required
    />

    <v-text-field
      v-model="form.email"
      :error-messages="r$.email.$errors"
      :label="$t('common.fields.email')"
      type="email"
      required
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

    <LinkButton @click="handleLogInClick">
      {{ $t('auth.register.haveAccount') }} {{ $t('auth.loginLink') }}
    </LinkButton>
  </CardDialog>
</template>

<script setup lang="ts">
import { maxLength, required } from '@regle/rules';

import type { RegistrationForm } from '@/types/auth';

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
  confirm: [form: RegistrationForm];
  'log-in-click': [];
}>();

const dialog = defineModel<boolean>({ required: true });
// Stryker restore all

const showPassword = ref(false);

const form = ref<RegistrationForm>({
  name: '',
  email: '',
  password: '',
  password_confirmation: ''
});

const externalErrors = useExternalErrors(() => props.serverErrors);

const { r$ } = useRegle(
  form,
  {
    name: { required, maxLength: maxLength(255) },
    ...accountEmailRules(),
    ...newPasswordRules(() => form.value.password)
  },
  { externalErrors }
);

const { handleCancel, handleConfirm, handleAfterLeave } = useDialogForm(
  dialog,
  r$,
  {
    form,
    onReset: () => {
      showPassword.value = false;
    },
    onSubmit: (values) => emit('confirm', values)
  }
);

function handleLogInClick() {
  dialog.value = false;

  emit('log-in-click');
}
</script>
