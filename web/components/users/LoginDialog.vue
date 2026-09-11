<template>
  <FormDialog
    v-model="dialog"
    :confirm-disabled="r$.$invalid"
    :loading="loading"
    :title="$t('auth.login.title')"
    @cancel="handleCancel"
    @confirm="handleConfirm"
    @after-leave="handleAfterLeave"
  >
    <Field :data-invalid="email.invalid">
      <FieldLabel :for="email.id">{{ $t('common.fields.email') }}</FieldLabel>

      <Input
        v-model="form.email"
        type="email"
        required
        v-bind="email.control"
      />

      <FieldError :id="email.errorId" :errors="email.errors" />
    </Field>

    <Field :data-invalid="password.invalid">
      <FieldLabel :for="password.id">{{
        $t('common.fields.password')
      }}</FieldLabel>

      <Input
        v-model="form.password"
        type="password"
        required
        v-bind="password.control"
      />

      <FieldError :id="password.errorId" :errors="password.errors" />
    </Field>

    <div class="flex flex-col gap-1">
      <Button
        type="button"
        variant="link"
        size="sm"
        class="h-auto justify-start p-0"
        @click="handleForgotPassword"
      >
        {{ $t('auth.login.forgotPasswordLink') }}
      </Button>

      <Button
        type="button"
        variant="link"
        size="sm"
        class="h-auto justify-start p-0"
        @click="handleRegister"
      >
        {{ $t('auth.login.noAccount') }} {{ $t('auth.login.registerLink') }}
      </Button>
    </div>
  </FormDialog>
</template>

<script setup lang="ts">
import { required } from '@regle/rules';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

import type { Credentials } from '@/types/auth';

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
  confirm: [form: Credentials];
  forgotPassword: [];
  register: [];
}>();

const dialog = defineModel<boolean>({ required: true });
// Stryker restore all

// * Prefilled intentionally, kept for local development (matches variant/vuetify).
const form = ref<Credentials>({
  email: 'test@example.com',
  password: 'gmaz1234'
});

const externalErrors = useExternalErrors(() => props.serverErrors);

const { r$ } = useRegle(
  form,
  {
    ...credentialEmailRules(),
    // * Not `newPasswordRules` — this password is being checked, not set, so the 8–255 bounds are the server's business and a stale short password must still be able to sign in.
    password: labeledRules('validation.fieldNames.password', { required })
  },
  { externalErrors }
);

const email = useFieldAria(() => r$.email.$errors);
const password = useFieldAria(() => r$.password.$errors);

const { handleCancel, handleConfirm, handleAfterLeave } = useDialogForm(
  dialog,
  r$,
  { form, onSubmit: (values) => emit('confirm', values) }
);

function handleForgotPassword() {
  dialog.value = false;

  emit('forgotPassword');
}

function handleRegister() {
  dialog.value = false;

  emit('register');
}
</script>
