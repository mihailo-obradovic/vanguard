<template>
  <CardDialog
    v-model="dialog"
    :confirm-disabled="r$.$invalid"
    :loading="loading"
    :title="editMode ? 'Edit User' : 'Create User'"
    @cancel="handleCancel"
    @confirm="handleConfirm"
  >
    <v-text-field
      v-model="form.name"
      :error-messages="r$.name.$errors"
      label="Name"
      required
    />

    <v-text-field
      v-model="form.email"
      :error-messages="r$.email.$errors"
      label="Email"
      type="email"
      required
    />

    <v-select v-model="form.role" :items="roleItems" label="Role" />

    <PasswordField
      v-model="form.password"
      v-model:visible="showPassword"
      :error-messages="r$.password.$errors"
      :label="editMode ? 'New password (optional)' : 'Password'"
      :required="!editMode"
    />

    <PasswordField
      v-model="form.password_confirmation"
      v-model:visible="showPassword"
      :error-messages="r$.password_confirmation.$errors"
      :label="editMode ? 'Confirm new password' : 'Confirm Password'"
      :required="!editMode"
    />
  </CardDialog>
</template>

<script setup lang="ts">
import { useRegle } from '@regle/core';
import {
  email,
  maxLength,
  minLength,
  required,
  requiredIf,
  sameAs
} from '@regle/rules';

import type { User } from '@/types/auth';
import type { CreateUserForm } from '@/types/user';

const props = withDefaults(
  defineProps<{
    editMode?: boolean;
    loading?: boolean;
    user?: User | null;
    serverErrors?: Record<string, string[]>;
  }>(),
  {
    editMode: false,
    loading: false,
    user: null,
    serverErrors: () => ({})
  }
);

const emit = defineEmits<{
  confirm: [form: CreateUserForm];
}>();

const dialog = defineModel<boolean>({ required: true });

const roleItems = [
  { title: 'User', value: 'user' },
  { title: 'Admin', value: 'admin' }
];

function emptyForm(): CreateUserForm {
  return {
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'user'
  };
}

const form = ref<CreateUserForm>(emptyForm());

const showPassword = ref(false);

const externalErrors = useExternalErrors(() => props.serverErrors);

// Create requires a password; edit only validates one when entered.
const { r$ } = useRegle(
  form,
  () => ({
    name: { required, maxLength: maxLength(255) },
    email: { required, email, maxLength: maxLength(255) },
    password: props.editMode
      ? { minLength: minLength(8) }
      : { required, minLength: minLength(8) },
    password_confirmation: {
      requiredIf: requiredIf(() => !props.editMode || !!form.value.password),
      sameAs: sameAs(() => form.value.password, 'password')
    }
  }),
  { externalErrors }
);

function handleCancel() {
  dialog.value = false;
}

async function handleConfirm() {
  const { valid } = await r$.$validate();

  if (valid) {
    emit('confirm', { ...form.value });
  }
}

watch(dialog, (open) => {
  if (!open) {
    return;
  }

  form.value =
    props.editMode && props.user
      ? {
          name: props.user.name,
          email: props.user.email,
          password: '',
          password_confirmation: '',
          role: props.user.role
        }
      : emptyForm();

  showPassword.value = false;
  r$.$reset();
});
</script>
