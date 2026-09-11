<template>
  <div class="user-card" @keydown.enter="confirmFromEnter">
    <div class="user-card-header">
      <h2>{{ $t('profile.title') }}</h2>

      <div class="user-card-actions">
        <button
          v-if="editMode"
          type="button"
          class="icon-btn icon-btn-danger"
          :aria-label="$t('common.actions.cancel')"
          @click="resetForm"
        >
          <X class="size-4" />
        </button>

        <button
          v-if="!editMode"
          type="button"
          class="icon-btn icon-btn-primary"
          :aria-label="$t('common.actions.edit')"
          @click="startEditing"
        >
          <Pencil class="size-4" />
        </button>

        <button
          v-else
          type="button"
          class="icon-btn icon-btn-success"
          :aria-label="$t('common.actions.save')"
          :disabled="loading"
          @click="handleSubmit"
        >
          <Loader2 v-if="loading" class="size-4 animate-spin" />
          <Check v-else class="size-4" />
        </button>
      </div>
    </div>

    <UIScrollArea class="user-card-fields">
      <div class="user-card-fields-inner">
        <Field :data-invalid="name.invalid">
          <FieldLabel :for="name.id">{{ $t('common.fields.name') }}</FieldLabel>

          <Input
            v-model="form.name"
            type="text"
            :readonly="!editMode"
            v-bind="name.control"
          />

          <FieldError :id="name.errorId" :errors="name.errors" />
        </Field>

        <Field :data-invalid="email.invalid">
          <FieldLabel :for="email.id">{{
            $t('common.fields.email')
          }}</FieldLabel>

          <Input
            v-model="form.email"
            type="email"
            :readonly="!editMode"
            v-bind="email.control"
          />

          <FieldError :id="email.errorId" :errors="email.errors" />
        </Field>

        <div class="verification-row">
          <VerificationBadge :verified="!!user?.email_verified_at">
            {{
              user?.email_verified_at
                ? $t('profile.info.verified')
                : $t('profile.info.notVerified')
            }}
          </VerificationBadge>

          <!-- * Stays in the row once the address is verified, reserved rather than removed: it is
               what gives this row its height, and dropping it pulls the fields below it up. `inert`
               keeps a control nobody can see out of the tab order and the accessibility tree. -->
          <button
            type="button"
            class="resend-btn"
            :class="{ reserved: Boolean(user?.email_verified_at) }"
            :inert="Boolean(user?.email_verified_at)"
            :disabled="isResending"
            @click="resendVerification()"
          >
            <UIReservedLabel
              :variants="{
                idle: $t('profile.info.resend'),
                pending: $t('profile.info.resending')
              }"
              :active="isResending ? 'pending' : 'idle'"
            />
          </button>
        </div>

        <template v-if="editMode">
          <Field :data-invalid="currentPassword.invalid">
            <FieldLabel :for="currentPassword.id">{{
              $t('profile.form.currentPassword')
            }}</FieldLabel>

            <Input
              v-model="form.current_password"
              type="password"
              v-bind="currentPassword.control"
            />

            <FieldError
              :id="currentPassword.errorId"
              :errors="currentPassword.errors"
            />
          </Field>

          <Field :data-invalid="newPassword.invalid">
            <FieldLabel :for="newPassword.id">{{
              $t('profile.form.newPassword')
            }}</FieldLabel>

            <Input
              v-model="form.password"
              type="password"
              v-bind="newPassword.control"
            />

            <FieldError
              :id="newPassword.errorId"
              :errors="newPassword.errors"
            />
          </Field>

          <Field :data-invalid="confirmPassword.invalid">
            <FieldLabel :for="confirmPassword.id">{{
              $t('profile.form.confirmNewPassword')
            }}</FieldLabel>

            <Input
              v-model="form.password_confirmation"
              type="password"
              v-bind="confirmPassword.control"
            />

            <FieldError
              :id="confirmPassword.errorId"
              :errors="confirmPassword.errors"
            />
          </Field>
        </template>
      </div>
    </UIScrollArea>
  </div>
</template>

<script setup lang="ts">
import { requiredIf } from '@regle/rules';
import { Check, Loader2, Pencil, X } from '@lucide/vue';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

import {
  useResendEmailVerification,
  useUpdateProfile
} from '@/services/queries/useAuthQueries';

import type { ProfileForm } from '@/types/user';

const { t } = useI18n();

const { user } = storeToRefs(useAuthStore());

const editMode = ref(false);

const { mutate: resendVerification, isLoading: isResending } =
  useResendEmailVerification({
    onSuccess: () => {
      $toast(t('profile.toasts.verificationSent'), 'success');
    }
  });

const initialForm = computed(() => ({
  name: user.value?.name || '',
  email: user.value?.email || '',
  current_password: '',
  password: '',
  password_confirmation: ''
}));

const form = ref({ ...initialForm.value });

// * The card owns the whole edit: submitting it, the 422s that come back onto its own fields, and leaving edit mode once the save lands. Nothing above it has to know the order those happen in.
const {
  mutate: updateProfile,
  isLoading: loading,
  error: updateProfileError
} = useUpdateProfile({
  // * A validation failure this form could have caught belongs on its field, not in a toast.
  errorHandling: { suppressToasts: 'validation' },
  onSuccess: () => {
    $toast(t('profile.toasts.updated'), 'success');

    resetForm();
  }
});

const externalErrors = useExternalErrors(
  useValidationErrors(updateProfileError)
);

// * Mirrors ProfileUpdateRequest: the current password is only needed when setting a new one.
const { r$ } = useRegle(
  form,
  () => ({
    ...nameRules(),
    // * The signed-in user already owns their own address, so the check has to ignore them.
    ...accountEmailRules(() => user.value?.id),
    current_password: labeledRules('validation.fieldNames.currentPassword', {
      requiredIf: requiredIf(() => !!form.value.password)
    }),
    ...newPasswordRules(() => form.value.password, 'change')
  }),
  { externalErrors }
);

const name = useFieldAria(() => r$.name.$errors);
const email = useFieldAria(() => r$.email.$errors);
const currentPassword = useFieldAria(() => r$.current_password.$errors);
const newPassword = useFieldAria(() => r$.password.$errors);
const confirmPassword = useFieldAria(() => r$.password_confirmation.$errors);

function startEditing() {
  editMode.value = true;
}

function resetForm() {
  editMode.value = false;

  r$.$reset({ toState: { ...initialForm.value }, clearExternalErrors: true });
}

async function handleSubmit() {
  const { valid } = await r$.$validate();

  if (!valid) {
    return;
  }

  const updateData: ProfileForm = {
    name: form.value.name,
    email: form.value.email
  };

  // * Only include the password pair — and the current-password challenge that authorizes it — when a new password is being set; a present-but-empty current_password is rejected by the backend.
  if (form.value.password) {
    updateData.current_password = form.value.current_password;
    updateData.password = form.value.password;
    updateData.password_confirmation = form.value.password_confirmation;
  }

  updateProfile(updateData);
}

const confirmFromEnter = useConfirmOnEnter(handleSubmit, () => editMode.value);

// * Window-level so Esc cancels editing even when focus has left the card
onKeyStroke('Escape', () => {
  if (editMode.value) {
    resetForm();
  }
});
</script>

<style scoped>
.user-card {
  background: var(--color-surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow-card);
  border: 1px solid var(--color-border-legacy);
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  /* * min-height: 0 hands the overflow to the fields below rather than growing the card past the
     page — main.css pins the page to overflow-y: hidden, so an unbounded card is unreachable. */
  min-height: 0;
  max-height: 100%;
}

.user-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  flex: 0 0 auto;
}

.user-card-header h2 {
  margin: 0;
  color: var(--color-brand);
  font-size: 24px;
  font-weight: 600;
}

.user-card-actions {
  display: flex;
  gap: 8px;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  color: var(--color-on-brand);
  transition: opacity var(--transition);
}

.icon-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.icon-btn-primary {
  background-color: var(--color-brand);
}

.icon-btn-success {
  background-color: var(--color-success);
}

.icon-btn-danger {
  background-color: var(--color-danger);
}

.user-card-fields {
  min-height: 0;
  padding: 10px 24px 24px 24px;
}

.user-card-fields-inner {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.verification-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.resend-btn {
  background-color: transparent;
  color: var(--color-brand);
  border: 1px solid var(--color-brand);
  padding: 6px 12px;
  border-radius: var(--radius);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition);
}

.resend-btn.reserved {
  /* * `visibility: hidden` still occupies the row; `display: none` would give the height back. */
  visibility: hidden;
}

.resend-btn:hover:not(:disabled) {
  background-color: var(--color-brand);
  color: var(--color-on-brand);
}

.resend-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
