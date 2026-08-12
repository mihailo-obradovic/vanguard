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
      Already have an account? Log in
    </LinkButton>
  </CardDialog>
</template>

<script setup lang="ts">
import { email, maxLength, required } from '@regle/rules';

import type { RegistrationForm } from '@/types/auth';

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
    email: { required, email, maxLength: maxLength(255) },
    ...newPasswordRules(() => form.value.password)
  },
  { externalErrors }
);

function handleCancel() {
  dialog.value = false;
}

async function handleConfirm() {
  const { valid } = await r$.$validate();

  if (valid) {
    emit('confirm', form.value);
  }
}

function handleLogInClick() {
  dialog.value = false;

  emit('log-in-click');
}

function handleAfterLeave() {
  showPassword.value = false;

  r$.$reset({ toInitialState: true, clearExternalErrors: true });
}
</script>
