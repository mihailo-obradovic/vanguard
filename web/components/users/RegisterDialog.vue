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
    <Field :data-invalid="name.invalid">
      <FieldLabel :for="name.id">{{ $t('common.fields.name') }}</FieldLabel>

      <Input v-model="form.name" type="text" required v-bind="name.control" />

      <FieldError :id="name.errorId" :errors="name.errors" />
    </Field>

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

    <Field :data-invalid="confirmation.invalid">
      <FieldLabel :for="confirmation.id">{{
        $t('common.fields.passwordConfirmation')
      }}</FieldLabel>

      <Input
        v-model="form.password_confirmation"
        type="password"
        required
        v-bind="confirmation.control"
      />

      <FieldError :id="confirmation.errorId" :errors="confirmation.errors" />
    </Field>

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
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

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

const name = useFieldAria(() => r$.name.$errors);
const email = useFieldAria(() => r$.email.$errors);
const password = useFieldAria(() => r$.password.$errors);
const confirmation = useFieldAria(() => r$.password_confirmation.$errors);

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
