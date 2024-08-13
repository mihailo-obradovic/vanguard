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
  </CardDialog>
</template>

<script setup>
const emit = defineEmits(['confirm']);

const dialog = defineModel({
  type: Boolean,
  required: true
});

const form = ref({
  email: '',
  password: ''
});

const isFormValid = computed(() => {
  return !!form.value.email && !!form.value.password;
});

const handleCancel = () => {
  dialog.value = false;
};

const handleConfirm = () => {
  emit('confirm', form.value);
};
</script>
