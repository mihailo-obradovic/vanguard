<template>
  <CardDialog
    v-model="dialog"
    :confirm-disabled="!isFormValid"
    :loading="loading"
    title="Register"
    @cancel="handleCancel"
    @confirm="handleConfirm"
  >
    <v-text-field v-model="form.name" label="Name" required />

    <v-text-field v-model="form.email" label="Email" type="email" required />

    <PasswordField
      v-model="form.password"
      v-model:visible="showPassword"
      label="Password"
      required
    />

    <PasswordField
      v-model="form.password_confirmation"
      v-model:visible="showPassword"
      label="Confirm Password"
      required
    />
  </CardDialog>
</template>

<script setup lang="ts">
import type { RegistrationForm } from '@/types/auth';

withDefaults(defineProps<{ loading?: boolean }>(), { loading: false });

const emit = defineEmits<{
  confirm: [form: RegistrationForm];
}>();

const dialog = defineModel<boolean>({ required: true });

const showPassword = ref(false);

const initialForm = {
  name: '',
  email: '',
  password: '',
  password_confirmation: ''
};

const form = ref(Object.assign({}, initialForm));

const isFormValid = computed(() => {
  const isFormFilled =
    !!form.value.email &&
    !!form.value.password &&
    !!form.value.password_confirmation;

  const doPasswordsMatch =
    form.value.password === form.value.password_confirmation;

  return isFormFilled && doPasswordsMatch;
});

function handleCancel() {
  dialog.value = false;
}

function handleConfirm() {
  emit('confirm', form.value);
}

watch(dialog, (value) => {
  if (!value) {
    Object.assign(form.value, initialForm);
  }
});
</script>
