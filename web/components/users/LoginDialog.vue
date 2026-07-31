<template>
  <CardDialog
    v-model="dialog"
    :confirm-disabled="!isFormValid"
    :loading="loading"
    title="Log In"
    @cancel="handleCancel"
    @confirm="handleConfirm"
  >
    <v-text-field v-model="form.email" label="Email" type="email" required />

    <PasswordField v-model="form.password" label="Password" required />

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
import type { Credentials } from '@/types/auth';

withDefaults(defineProps<{ loading?: boolean }>(), { loading: false });

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

const isFormValid = computed(() => {
  return !!form.value.email && !!form.value.password;
});

function handleCancel() {
  dialog.value = false;
}

function handleConfirm() {
  emit('confirm', form.value);
}

function handleForgotPasswordClick() {
  dialog.value = false;

  emit('forgot-password-click');
}

watch(dialog, (value) => {
  if (!value) {
    Object.assign(form.value, initialForm);
  }
});
</script>
