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
import { email, maxLength, required } from '@regle/rules';

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

// * What the form should hold when the dialog opens: the edited user's snapshot, or a blank slate
function initialFormState(): CreateUserForm {
  if (!props.editMode || !props.user) {
    return emptyForm();
  }

  return {
    name: props.user.name,
    email: props.user.email,
    password: '',
    password_confirmation: '',
    role: props.user.role
  };
}

const form = ref<CreateUserForm>(emptyForm());

const showPassword = ref(false);

const externalErrors = useExternalErrors(() => props.serverErrors);

// * Create requires a password; edit only validates one when entered. Stays a getter so mode changes re-evaluate.
function buildRules() {
  return {
    name: { required, maxLength: maxLength(255) },
    email: { required, email, maxLength: maxLength(255) },
    ...newPasswordRules(
      () => form.value.password,
      () => props.editMode
    )
  };
}

const { r$ } = useRegle(form, buildRules, { externalErrors });

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

  showPassword.value = false;

  r$.$reset({ toState: initialFormState(), clearExternalErrors: true });
});
</script>
