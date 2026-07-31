<template>
  <CardDialog
    v-model="dialog"
    :confirm-disabled="!isFormValid"
    :loading="loading"
    :title="editMode ? 'Edit User' : 'Create User'"
    @cancel="handleCancel"
    @confirm="handleConfirm"
  >
    <v-text-field v-model="form.name" label="Name" required />

    <v-text-field v-model="form.email" label="Email" type="email" required />

    <v-select v-model="form.role" :items="roleItems" label="Role" />

    <PasswordField
      v-model="form.password"
      v-model:visible="showPassword"
      :label="editMode ? 'New password (optional)' : 'Password'"
      :required="!editMode"
    />

    <PasswordField
      v-model="form.password_confirmation"
      v-model:visible="showPassword"
      :label="editMode ? 'Confirm new password' : 'Confirm Password'"
      :required="!editMode"
    />
  </CardDialog>
</template>

<script setup lang="ts">
import type { User } from '@/types/auth';
import type { CreateUserForm } from '@/types/user';

const props = withDefaults(
  defineProps<{
    editMode?: boolean;
    loading?: boolean;
    user?: User | null;
  }>(),
  {
    editMode: false,
    loading: false,
    user: null
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

const isFormValid = computed(() => {
  if (!form.value.name || !form.value.email) {
    return false;
  }

  // Create requires a password; edit only validates one when entered.
  if (!props.editMode) {
    return (
      !!form.value.password &&
      form.value.password === form.value.password_confirmation
    );
  }

  if (form.value.password || form.value.password_confirmation) {
    return form.value.password === form.value.password_confirmation;
  }

  return true;
});

function handleCancel() {
  dialog.value = false;
}

function handleConfirm() {
  emit('confirm', { ...form.value });
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
});
</script>
