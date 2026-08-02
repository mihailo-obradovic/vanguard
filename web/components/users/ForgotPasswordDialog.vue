<template>
  <CardDialog
    v-model="dialog"
    :confirm-disabled="r$.$invalid"
    :loading="loading"
    title="Forgot Password"
    @cancel="handleCancel"
    @confirm="handleConfirm"
  >
    <p class="mb-4 text-body-2">
      A link for resetting your password will be sent to your email.
    </p>

    <v-text-field
      v-model="form.email"
      :error-messages="r$.email.$errors"
      label="Email"
      type="email"
      required
    />
  </CardDialog>
</template>

<script setup lang="ts">
import { email, required } from '@regle/rules';

const props = withDefaults(
  defineProps<{
    loading?: boolean;
    serverErrors?: Record<string, string[]>;
  }>(),
  { loading: false, serverErrors: () => ({}) }
);

const emit = defineEmits<{
  confirm: [form: { email: string }];
}>();

const dialog = defineModel<boolean>({ required: true });

const initialForm = {
  email: ''
};

const form = ref(Object.assign({}, initialForm));

const externalErrors = useExternalErrors(() => props.serverErrors);

const { r$ } = useRegle(
  form,
  {
    email: { required, email }
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

watch(dialog, (value) => {
  if (!value) {
    form.value = Object.assign({}, initialForm);
    r$.$reset();
  }
});
</script>
