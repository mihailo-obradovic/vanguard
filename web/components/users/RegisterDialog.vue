<template>
  <CardDialog
    v-model="dialog"
    :confirm-disabled="!isFormValid"
    title="Register"
    @cancel="handleCancel"
    @confirm="handleConfirm"
  >
    <v-text-field v-model="form.name" label="Name" required />

    <v-text-field v-model="form.email" label="Email" type="email" required />

    <v-text-field
      v-model="form.password"
      label="Password"
      type="password"
      required
    />

    <v-text-field
      v-model="form.password_confirmation"
      label="Confirm Password"
      type="password"
      required
    />
  </CardDialog>
</template>

<script setup>
const emit = defineEmits(['confirm']);

const dialog = defineModel({
  type: Boolean,
  required: true
});

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
    form.value = Object.assign({}, initialForm);
  }
});
</script>
