<template>
  <CardDialog
    v-model="dialog"
    :confirm-disabled="r$.$invalid"
    :loading="loading"
    :title="$t('graphqlDemo.editTitle', { name: user?.name ?? '' })"
    @cancel="handleCancel"
    @confirm="handleConfirm"
    @after-leave="emit('after-leave')"
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
  </CardDialog>
</template>

<script setup lang="ts">
import { maxLength, required } from '@regle/rules';

import type { User } from '@/types/auth';

// * The identity fields of a user, without the password pair UserFormDialog carries — the
// * GraphQL demo's mutation covers name/email/role only.
export type UserDetailsForm = Pick<User, 'name' | 'email' | 'role'>;

// ! Stryker instruments this block with locally declared coverage helpers, and a compiler
// ! macro is hoisted out of setup() — referencing them there is a compile error, not a
// ! warning. The defaults inside go unmutated as a result (`catalyst/operations.md`).
// Stryker disable all
const props = withDefaults(
  defineProps<{
    loading?: boolean;
    user?: User | null;
    serverErrors?: Record<string, string[]>;
  }>(),
  {
    loading: false,
    user: null,
    serverErrors: () => ({})
  }
);

const emit = defineEmits<{
  confirm: [form: UserDetailsForm];
  // * Re-emitted from CardDialog so the owner can clear the state this dialog renders only
  // * once the close transition has finished (the title would otherwise empty out mid-fade).
  'after-leave': [];
}>();

const dialog = defineModel<boolean>({ required: true });
// Stryker restore all

const { t } = useI18n();

const roleItems = computed(() => [
  { title: t('users.roles.user'), value: 'user' },
  { title: t('users.roles.admin'), value: 'admin' }
]);

// * What the form should hold when the dialog opens: the edited user's snapshot.
function initialFormState(): UserDetailsForm {
  return {
    name: props.user?.name ?? '',
    email: props.user?.email ?? '',
    role: props.user?.role ?? 'user'
  };
}

const form = ref<UserDetailsForm>(initialFormState());

const externalErrors = useExternalErrors(() => props.serverErrors);

const { r$ } = useRegle(
  form,
  {
    name: { required, maxLength: maxLength(255) },
    // * The user being edited owns the address already, so the check has to ignore them.
    ...accountEmailRules(() => props.user?.id)
  },
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

// ! Resets on open, not after-leave: the target state depends on the `user` prop, which the parent assigns right before opening — at close time it still describes the previous session
watch(dialog, (open) => {
  if (!open) {
    return;
  }

  r$.$reset({ toState: initialFormState(), clearExternalErrors: true });
});
</script>
