<template>
  <CardDialog
    v-model="dialog"
    :confirm-disabled="!isFormValid"
    title="Forgot Password"
    @cancel="handleCancel"
    @confirm="handleConfirm"
  >
    <p class="mb-4 text-body-2">
      A new password will be sent to your email. You can change it later through
      the profile page.
    </p>

    <v-text-field v-model="form.email" label="Email" type="email" required />
  </CardDialog>
</template>

<script setup>
const emit = defineEmits(['confirm']);

const dialog = defineModel({
  type: Boolean,
  required: true
});

const form = ref({
  email: ''
});

const isFormValid = computed(() => {
  return !!form.value.email;
});

function handleCancel() {
  dialog.value = false;
}

function handleConfirm() {
  emit('confirm', form.value);
}
</script>
