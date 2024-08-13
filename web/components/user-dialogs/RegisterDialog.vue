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
      v-model="form.passwordConfirmation"
      label="Confirm Password"
      type="password"
      required
    />
  </CardDialog>
</template>

<script setup>
import CardDialog from '~/components/shared/CardDialog.vue';

const emit = defineEmits(['confirm']);

const dialog = defineModel({
  type: Boolean,
  required: true
});

const form = ref({
  name: '',
  email: '',
  password: '',
  passwordConfirmation: ''
});

const isFormValid = computed(() => {
  const isFormFilled =
    !!form.value.email &&
    !!form.value.password &&
    !!form.value.passwordConfirmation;

  const doPasswordsMatch =
    form.value.password === form.value.passwordConfirmation;

  return isFormFilled && doPasswordsMatch;
});

const handleCancel = () => {
  dialog.value = false;
};

const handleConfirm = () => {
  emit('confirm', form.value);
};
</script>
