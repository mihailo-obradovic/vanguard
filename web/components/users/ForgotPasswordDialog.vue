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
    <p class="mb-4 text-body-2">{{ $t('auth.forgotPassword.hint') }}</p>

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
// ! Stryker instruments this block with locally declared coverage helpers, and a compiler
// ! macro is hoisted out of setup() — referencing them there is a compile error, not a
// ! warning. The defaults inside go unmutated as a result (`catalyst/operations.md`).
// Stryker disable all
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
// Stryker restore all

const form = ref({
  email: ''
});

const externalErrors = useExternalErrors(() => props.serverErrors);

const { r$ } = useRegle(
  form,
  {
    ...credentialEmailRules()
  },
  { externalErrors }
);

const { handleCancel, handleConfirm, handleAfterLeave } = useDialogForm(
  dialog,
  r$,
  { form, onSubmit: (values) => emit('confirm', values) }
);

function handleBackToLoginClick() {
  dialog.value = false;

  emit('back-to-login-click');
}
</script>
