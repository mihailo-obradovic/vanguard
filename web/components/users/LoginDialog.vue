<template>
  <CardDialog
    v-model="dialog"
    :confirm-disabled="!isFormValid"
    title="Log In"
    @cancel="handleCancel"
    @confirm="handleConfirm"
  >
    <v-text-field v-model="form.email" label="Email" type="email" required />

    <v-text-field
      v-model="form.password"
      label="Password"
      type="password"
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

<script setup>
const emit = defineEmits(['confirm', 'forgot-password-click']);

const dialog = defineModel({
  type: Boolean,
  required: true
});

const initialForm = {
  email: '',
  password: ''
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
