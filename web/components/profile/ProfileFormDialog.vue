<template>
  <UIDialog :open="open" :title="$t('profile.edit')" @close="emit('close')">
    <form class="profile-form" novalidate @submit.prevent="handleSubmit">
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
        v-model="form.current_password"
        :label="$t('profile.form.currentPassword')"
        :errors="r$.current_password.$errors"
        type="password"
        :required="!!form.password"
        :disabled="submitting"
      />

      <UIField
        v-model="form.password"
        :label="$t('profile.form.newPassword')"
        :errors="r$.password.$errors"
        type="password"
        :disabled="submitting"
      />

      <UIField
        v-model="form.password_confirmation"
        :label="$t('profile.form.confirmNewPassword')"
        :errors="r$.password_confirmation.$errors"
        type="password"
        :required="!!form.password"
        :disabled="submitting"
      />

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
          {{
            submitting ? $t('common.actions.saving') : $t('profile.form.submit')
          }}
        </button>
      </UIDialogActions>
    </form>
  </UIDialog>
</template>

<script setup lang="ts">
import { maxLength, required, requiredIf } from '@regle/rules';

import type { User } from '@/types/auth';
import type { ProfileForm } from '@/types/user';

const props = defineProps<{
  open: boolean;
  // * The signed-in user the form is seeded from. Required, not nullable: there is nothing to edit without one, so the page renders no dialog until it has one.
  user: User;
  submitting: boolean;
  // * The owning page's 422 map (`useValidationErrors`), mirrored into Regle here.
  serverErrors: Record<string, string[]>;
}>();

const emit = defineEmits<{
  submit: [payload: ProfileForm];
  close: [];
}>();

// * Seeded from the prop at construction, so the watcher below only has to handle *re*-opening — the form is never empty, because there is never no user.
const form = ref(formFor(props.user));

// * Mirrors ProfileUpdateRequest: the current password is only needed when setting a new one.
const { r$ } = useRegle(
  form,
  () => ({
    name: labeledRules('validation.fieldNames.name', {
      required,
      maxLength: maxLength(255)
    }),
    ...accountEmailRules(() => props.user.id),
    current_password: labeledRules('validation.fieldNames.currentPassword', {
      requiredIf: requiredIf(() => !!form.value.password)
    }),
    ...newPasswordRules(() => form.value.password, true)
  }),
  { externalErrors: useExternalErrors(() => props.serverErrors) }
);

// * The three password fields always start empty — a form seeded with them filled would be offering to re-send a password the user never typed.
function formFor(user: User) {
  return {
    name: user.name,
    email: user.email,
    current_password: '',
    password: '',
    password_confirmation: ''
  };
}

// ! Only the password pair — and the current-password challenge that authorizes it — travel when a
// ! new password is being set; a present-but-empty current_password is rejected by the backend.
function payloadFrom(values: ReturnType<typeof formFor>): ProfileForm {
  const payload: ProfileForm = { name: values.name, email: values.email };

  if (!values.password) return payload;

  return {
    ...payload,
    current_password: values.current_password,
    password: values.password,
    password_confirmation: values.password_confirmation
  };
}

async function handleSubmit() {
  const { valid } = await r$.$validate();

  if (!valid) return;

  emit('submit', payloadFrom(form.value));
}

// * Reset on open rather than on close: the fresh state comes from the `user` prop, and this dialog has no after-close hook to reset from (`catalyst/stacks/frontend/nuxt/validation.md`).
watch(
  () => props.open,
  (open) => {
    if (!open) return;

    r$.$reset({ toState: formFor(props.user), clearExternalErrors: true });
  }
);
</script>

<style scoped>
.profile-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cancel-btn {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.25s ease;
}

.cancel-btn:hover {
  background-color: #5a6268;
}

.submit-btn {
  background-color: rgb(0, 102, 255);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.25s ease;
}

.submit-btn:hover:not(:disabled) {
  background-color: rgba(0, 102, 255, 0.9);
}

.submit-btn:disabled,
.cancel-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
