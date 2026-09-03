<template>
  <UIDialog :open="open" :title="title" @close="emit('close')">
    <form class="user-form" novalidate @submit.prevent="handleSubmit">
      <UIField
        v-model="form.name"
        :label="$t('common.fields.name')"
        :errors="r$.name.$errors"
        type="text"
        required
        :disabled="submitting"
      />

      <UIField
        v-model="form.email"
        :label="$t('common.fields.email')"
        :errors="r$.email.$errors"
        type="email"
        required
        :disabled="submitting"
      />

      <UIField
        v-model="form.password"
        :label="passwordLabel"
        :errors="r$.password.$errors"
        type="password"
        :required="!isEdit"
        :disabled="submitting"
      />

      <UIField
        v-model="form.password_confirmation"
        :label="passwordConfirmationLabel"
        :errors="r$.password_confirmation.$errors"
        type="password"
        :required="!isEdit || !!form.password"
        :disabled="submitting"
      />

      <UIField :label="$t('common.fields.role')">
        <template #default="{ controlId }">
          <select
            :id="controlId"
            v-model="form.role"
            class="ui-field-control"
            required
            :disabled="submitting"
          >
            <option value="user">{{ $t('users.roles.user') }}</option>

            <option value="admin">{{ $t('users.roles.admin') }}</option>
          </select>
        </template>
      </UIField>

      <UIDialogActions>
        <button
          type="button"
          class="cancel-btn"
          :disabled="submitting"
          @click="emit('close')"
        >
          {{ $t('common.actions.cancel') }}
        </button>

        <button
          type="submit"
          class="submit-btn"
          :disabled="submitting || r$.$invalid"
        >
          <UIReservedLabel
            :variants="{
              create: $t('users.form.submitCreate'),
              update: $t('users.form.submitUpdate'),
              saving: $t('common.actions.saving')
            }"
            :active="submitting ? 'saving' : isEdit ? 'update' : 'create'"
          />
        </button>
      </UIDialogActions>
    </form>
  </UIDialog>
</template>

<script setup lang="ts">
import type { User } from '@/types/auth';
import type { CreateUserForm, UpdateUserForm } from '@/types/user';

const props = defineProps<{
  open: boolean;
  // * The user being edited, or `null` to create one — the only thing that decides the dialog's mode.
  user: User | null;
  submitting: boolean;
  // * The owning page's 422 map (`useValidationErrors`), mirrored into Regle here.
  serverErrors: Record<string, string[]>;
}>();

const emit = defineEmits<{
  create: [payload: CreateUserForm];
  update: [id: number, payload: UpdateUserForm];
  close: [];
}>();

const { t } = useI18n();

const form = ref<CreateUserForm>(blankForm());

const isEdit = computed(() => props.user !== null);

// * Create requires a password; edit only validates one when entered.
const { r$ } = useRegle(
  form,
  () => ({
    ...nameRules(),
    ...accountEmailRules(() => props.user?.id),
    ...newPasswordRules(
      () => form.value.password,
      () => (isEdit.value ? 'change' : 'set')
    )
  }),
  { externalErrors: useExternalErrors(() => props.serverErrors) }
);

const title = computed(() =>
  isEdit.value ? t('users.form.editTitle') : t('users.create')
);

// * Edit is a change-password form: both password labels carry the "optional" hint the mandatory pair does not.
const passwordLabel = computed(() =>
  isEdit.value
    ? `${t('common.fields.password')} ${t('users.form.passwordHint')}`
    : t('common.fields.password')
);

const passwordConfirmationLabel = computed(() =>
  isEdit.value
    ? `${t('common.fields.passwordConfirmation')} ${t('users.form.passwordConfirmationHint')}`
    : t('common.fields.passwordConfirmation')
);

function blankForm(): CreateUserForm {
  return {
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'user'
  };
}

function formFor(user: User | null): CreateUserForm {
  if (!user) {
    return blankForm();
  }

  return {
    ...blankForm(),
    name: user.name,
    email: user.email,
    role: user.role
  };
}

// ! The backend reads a present password as a change request, so an untouched pair must not travel —
// ! and a present-but-empty one is rejected outright.
function updatePayloadFrom(values: CreateUserForm): UpdateUserForm {
  const payload: UpdateUserForm = {
    name: values.name,
    email: values.email,
    role: values.role
  };

  if (!values.password) {
    return payload;
  }

  return {
    ...payload,
    password: values.password,
    password_confirmation: values.password_confirmation
  };
}

async function handleSubmit() {
  const { valid } = await r$.$validate();

  if (!valid) {
    return;
  }

  if (!props.user) {
    emit('create', { ...form.value });

    return;
  }

  emit('update', props.user.id, updatePayloadFrom(form.value));
}

// * Reset on open rather than on close: the fresh state depends on the `user` the page assigns right before opening, and this dialog has no after-close hook to reset from (`catalyst/stacks/frontend/nuxt/validation.md`).
watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }

    r$.$reset({ toState: formFor(props.user), clearExternalErrors: true });
  },
  // * Immediate, so a dialog mounted already open is seeded too — the page's own flag starts false, but nothing about the contract should depend on that.
  { immediate: true }
);
</script>

<style scoped>
.user-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cancel-btn {
  background-color: var(--color-secondary);
  color: var(--color-on-brand);
  border: none;
  padding: 8px 16px;
  border-radius: var(--radius);
  font-weight: 500;
  cursor: pointer;
  transition: background-color var(--transition);
}

.cancel-btn:hover {
  background-color: var(--color-secondary-hover);
}

.submit-btn {
  background-color: var(--color-brand);
  color: var(--color-on-brand);
  border: none;
  padding: 8px 16px;
  border-radius: var(--radius);
  font-weight: 500;
  cursor: pointer;
  transition: background-color var(--transition);
}

.submit-btn:hover:not(:disabled) {
  background-color: var(--color-brand-hover);
}

.submit-btn:disabled,
.cancel-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
