<template>
  <CardDialog
    v-model="dialog"
    :confirm-disabled="r$.$invalid"
    :loading="loading"
    title="Log In"
    @cancel="handleCancel"
    @confirm="handleConfirm"
  >
    <v-text-field
      v-model="form.email"
      :error-messages="r$.email.$errors"
      label="Email"
      type="email"
      required
    />

    <PasswordField
      v-model="form.password"
      :error-messages="r$.password.$errors"
      label="Password"
      required
    />

    <v-btn
      class="text-transform-none"
      color="link"
      size="small"
      variant="text"
      @click="handleForgotPasswordClick"
    >
      Forgot password?
    </v-btn>
  </CardDialog>
</template>

<script setup lang="ts">
import { useRegle } from '@regle/core';
import { email, required } from '@regle/rules';

import type { Credentials } from '@/types/auth';

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
}>();

const dialog = defineModel<boolean>({ required: true });

const initialForm = {
  email: 'test@example.com',
  password: 'gmaz1234'
};

const form = ref(Object.assign({}, initialForm));

const externalErrors = useExternalErrors(() => props.serverErrors);

const { r$ } = useRegle(
  form,
  {
    email: { required, email },
    password: { required }
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

function handleForgotPasswordClick() {
  dialog.value = false;

  emit('forgot-password-click');
}

watch(dialog, (value) => {
  if (!value) {
    Object.assign(form.value, initialForm);
    r$.$reset();
  }
});
</script>
