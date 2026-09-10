<template>
  <FormDialog
    v-model="dialog"
    :confirm-disabled="r$.$invalid"
    :loading="loading"
    :title="$t('auth.register.title')"
    @cancel="handleCancel"
    @confirm="handleConfirm"
    @after-leave="handleAfterLeave"
  >
    <UIField
      v-model="form.name"
      :label="$t('common.fields.name')"
      :errors="r$.name.$errors"
      type="text"
      required
    />

    <UIField
      v-model="form.email"
      :label="$t('common.fields.email')"
      :errors="r$.email.$errors"
      type="email"
      required
    />

    <UIField
      v-model="form.password"
      :label="$t('common.fields.password')"
      :errors="r$.password.$errors"
      type="password"
      required
    />

    <UIField
      v-model="form.password_confirmation"
      :label="$t('common.fields.passwordConfirmation')"
      :errors="r$.password_confirmation.$errors"
      type="password"
      required
    />

    <Button
      type="button"
      variant="link"
      size="sm"
      class="h-auto justify-start p-0"
      @click="handleLogIn"
    >
      {{ $t('auth.register.haveAccount') }} {{ $t('auth.loginLink') }}
    </Button>
  </FormDialog>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button';

import type { RegistrationForm } from '@/types/auth';

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
  confirm: [form: RegistrationForm];
  logIn: [];
}>();

const dialog = defineModel<boolean>({ required: true });
// Stryker restore all

const form = ref<RegistrationForm>({
  name: '',
  email: '',
  password: '',
  password_confirmation: ''
});

const externalErrors = useExternalErrors(() => props.serverErrors);

const { r$ } = useRegle(
  form,
  {
    ...nameRules(),
    ...accountEmailRules(),
    ...newPasswordRules(() => form.value.password)
  },
  { externalErrors }
);

const { handleCancel, handleConfirm, handleAfterLeave } = useDialogForm(
  dialog,
  r$,
  { form, onSubmit: (values) => emit('confirm', values) }
);

function handleLogIn() {
  dialog.value = false;

  emit('logIn');
}
</script>
