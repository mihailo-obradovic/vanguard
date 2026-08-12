<template>
  <CardDialog
    v-model="dialog"
    :confirm-disabled="r$.$invalid"
    :loading="loading"
    :title="$t('auth.forgotPassword.title')"
    @cancel="handleCancel"
    @confirm="handleConfirm"
    @after-leave="handleAfterLeave"
  >
    <p class="mb-4 text-body-2">
      A link for resetting your password will be sent to your email.
    </p>

    <v-text-field
      v-model="form.email"
      :error-messages="r$.email.$errors"
      :label="$t('common.fields.email')"
      type="email"
      required
    />

    <LinkButton @click="handleBackToLoginClick">
      {{ $t('auth.backToLogin') }}
    </LinkButton>
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
  'back-to-login-click': [];
}>();

const dialog = defineModel<boolean>({ required: true });

const form = ref({
  email: ''
});

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

function handleBackToLoginClick() {
  dialog.value = false;

  emit('back-to-login-click');
}

function handleAfterLeave() {
  r$.$reset({ toInitialState: true, clearExternalErrors: true });
}
</script>
