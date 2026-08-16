<template>
  <CardDialog
    v-model="dialog"
    :confirm-disabled="r$.$invalid"
    :loading="loading"
    :title="editMode ? $t('users.form.editTitle') : $t('users.create')"
    @cancel="handleCancel"
    @confirm="handleConfirm"
  >
    <v-text-field
      v-model="form.name"
      :error-messages="r$.name.$errors"
      :label="$t('common.fields.name')"
      required
    />

    <v-text-field
      v-model="form.email"
      :error-messages="r$.email.$errors"
      :label="$t('common.fields.email')"
      type="email"
      required
    />

    <v-select
      v-model="form.role"
      :items="roleItems"
      :label="$t('common.fields.role')"
    />

    <PasswordField
      v-model="form.password"
      v-model:visible="showPassword"
      :error-messages="r$.password.$errors"
      :label="
        editMode
          ? $t('common.fields.newPassword')
          : $t('common.fields.password')
      "
      :required="!editMode"
    />

    <PasswordField
      v-model="form.password_confirmation"
      v-model:visible="showPassword"
      :error-messages="r$.password_confirmation.$errors"
      :label="
        editMode
          ? $t('common.fields.confirmNewPassword')
          : $t('common.fields.passwordConfirmation')
      "
      :required="!editMode"
    />
  </CardDialog>
</template>

<script setup lang="ts">
import { maxLength, required } from '@regle/rules';

import type { User } from '@/types/auth';
import type { CreateUserForm } from '@/types/user';

// ! Stryker instruments this block with locally declared coverage helpers, and a compiler
// ! macro is hoisted out of setup() — referencing them there is a compile error, not a
// ! warning. The defaults inside go unmutated as a result (`catalyst/operations.md`).
// Stryker disable all
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
// Stryker restore all

const roleItems = useRoleItems();

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
    // * The user being edited owns the address already, so the availability check must ignore them.
    ...accountEmailRules(() => (props.editMode ? props.user?.id : undefined)),
    ...newPasswordRules(
      () => form.value.password,
      () => props.editMode
    )
  };
}

const { r$ } = useRegle(form, buildRules, { externalErrors });

// * Passing `initialState` puts this form on the on-open reset: its target state depends on editMode/user, which the parent assigns right before opening (`useDialogForm`).
const { handleCancel, handleConfirm } = useDialogForm(dialog, r$, {
  form,
  initialState: initialFormState,
  onReset: () => {
    showPassword.value = false;
  },
  onSubmit: (values) => emit('confirm', values)
});
</script>
