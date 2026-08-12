<template>
  <CardDialog
    v-model="dialog"
    :confirm-disabled="r$.$invalid"
    :loading="loading"
    title="Register"
    @cancel="handleCancel"
    @confirm="handleConfirm"
  >
    <v-text-field
      v-model="form.name"
      :error-messages="r$.name.$errors"
      label="Name"
      required
    />

    <v-text-field
      v-model="form.email"
      :error-messages="r$.email.$errors"
      label="Email"
      type="email"
      required
    />

    <PasswordField
      v-model="form.password"
      v-model:visible="showPassword"
      :error-messages="r$.password.$errors"
      label="Password"
      required
    />

    <PasswordField
      v-model="form.password_confirmation"
      v-model:visible="showPassword"
      :error-messages="r$.password_confirmation.$errors"
      label="Confirm Password"
      required
    />
  </CardDialog>
</template>

<script setup lang="ts">
import { email, maxLength, minLength, required, sameAs } from '@regle/rules';

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
    password: { required, minLength: minLength(8) },
    password_confirmation: {
      required,
      sameAs: sameAs(() => form.value.password, 'password')
    }
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

watch(dialog, (open) => {
  if (open) {
    showPassword.value = false;
    r$.$reset({ toInitialState: true, clearExternalErrors: true });
  }
});
</script>
