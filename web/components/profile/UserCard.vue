<template>
  <u-card>
    <template #header>
      <div class="flex items-center justify-between gap-4">
        <h1 class="text-xl font-semibold">{{ $t('profile.title') }}</h1>

        <!-- * Icon-only, as on the vuetify variant. Each carries its own accessible name, since there is nothing else in the button to read. -->
        <div class="flex gap-1">
          <template v-if="editMode">
            <u-button
              color="error"
              variant="ghost"
              icon="i-lucide-x"
              :aria-label="$t('common.actions.cancel')"
              @click="resetForm"
            />

            <u-button
              type="submit"
              form="profile-form"
              color="success"
              variant="ghost"
              icon="i-lucide-check"
              :aria-label="
                isSaving
                  ? $t('common.actions.saving')
                  : $t('common.actions.save')
              "
              :loading="isSaving"
              :disabled="r$.$invalid"
            />
          </template>

          <u-button
            v-else
            variant="ghost"
            icon="i-lucide-pencil"
            :aria-label="$t('common.actions.edit')"
            @click="editMode = true"
          />
        </div>
      </div>
    </template>

    <form id="profile-form" class="space-y-4" @submit.prevent="handleSubmit">
      <u-form-field
        :label="$t('common.fields.name')"
        :error="r$.name.$errors[0]"
      >
        <u-input v-model="form.name" :readonly="!editMode" class="w-full" />
      </u-form-field>

      <u-form-field
        :label="$t('common.fields.email')"
        :error="r$.email.$errors[0]"
      >
        <u-input
          v-model="form.email"
          type="email"
          :readonly="!editMode"
          class="w-full"
        />
      </u-form-field>

      <template v-if="editMode">
        <u-form-field
          :label="$t('common.fields.currentPassword')"
          :error="r$.current_password.$errors[0]"
        >
          <u-input
            v-model="form.current_password"
            type="password"
            autocomplete="current-password"
            class="w-full"
          />
        </u-form-field>

        <u-form-field
          :label="$t('profile.form.newPassword')"
          :error="r$.password.$errors[0]"
        >
          <u-input
            v-model="form.password"
            type="password"
            autocomplete="new-password"
            class="w-full"
          />
        </u-form-field>

        <u-form-field
          :label="$t('profile.form.confirmNewPassword')"
          :error="r$.password_confirmation.$errors[0]"
        >
          <u-input
            v-model="form.password_confirmation"
            type="password"
            autocomplete="new-password"
            class="w-full"
          />
        </u-form-field>
      </template>
    </form>

    <dl class="mt-6 grid gap-4 sm:grid-cols-2">
      <div>
        <dt class="text-sm text-muted">{{ $t('common.fields.role') }}</dt>

        <dd class="mt-1"><RoleBadge :role="user.role" large /></dd>
      </div>

      <div>
        <dt class="text-sm text-muted">
          {{ $t('profile.info.emailVerified') }}
        </dt>

        <dd class="mt-1 flex items-center gap-2">
          <VerificationBadge :verified="!!user.email_verified_at" large>
            {{
              user.email_verified_at
                ? $t('profile.info.verified')
                : $t('profile.info.notVerified')
            }}
          </VerificationBadge>

          <u-button
            v-if="!user.email_verified_at"
            variant="link"
            size="sm"
            :loading="isResending"
            @click="resendVerification()"
          >
            {{
              isResending
                ? $t('profile.info.resending')
                : $t('profile.info.resend')
            }}
          </u-button>
        </dd>
      </div>

      <div>
        <dt class="text-sm text-muted">{{ $t('profile.info.memberSince') }}</dt>

        <dd class="mt-1">{{ formatDate(user.created_at) }}</dd>
      </div>

      <div>
        <dt class="text-sm text-muted">{{ $t('profile.info.lastUpdated') }}</dt>

        <dd class="mt-1">{{ formatDate(user.updated_at) }}</dd>
      </div>
    </dl>
  </u-card>
</template>

<script setup lang="ts">
import { requiredIf } from '@regle/rules';

import {
  useResendEmailVerification,
  useUpdateProfile
} from '@/services/queries/useAuthQueries';

import type { User } from '@/types/auth';
import type { ProfileForm } from '@/types/user';

const props = defineProps<{ user: User }>();

const { t } = useI18n();

const editMode = ref(false);

const form = ref(formFor(props.user));

const { mutate: resendVerification, isLoading: isResending } =
  useResendEmailVerification({
    onSuccess: () => $toast(t('profile.toasts.verificationSent'), 'success')
  });

// * The card owns the whole edit: submitting it, the 422s that come back onto its own fields, and leaving edit mode once the save lands. The page above it only supplies the user.
const {
  mutate: updateProfile,
  isLoading: isSaving,
  error: updateProfileError
} = useUpdateProfile({
  errorHandling: { hideValidationToast: true },
  onSuccess: () => {
    $toast(t('profile.toasts.updated'), 'success');

    resetForm();
  }
});

// * Mirrors ProfileUpdateRequest: the current password is only needed when setting a new one.
const { r$ } = useRegle(
  form,
  {
    ...nameRules(),
    // * The signed-in user already owns their own address, so the check has to ignore them.
    ...accountEmailRules(() => props.user.id),
    current_password: labeledRules('validation.fieldNames.currentPassword', {
      requiredIf: requiredIf(() => !!form.value.password)
    }),
    ...newPasswordRules(() => form.value.password, true)
  },
  { externalErrors: useExternalErrors(useValidationErrors(updateProfileError)) }
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

function resetForm() {
  editMode.value = false;

  r$.$reset({ toState: formFor(props.user), clearExternalErrors: true });
}

async function handleSubmit() {
  const { valid } = await r$.$validate();

  if (!valid) return;

  const payload: ProfileForm = {
    name: form.value.name,
    email: form.value.email
  };

  // ! Only the password pair — and the current-password challenge that authorizes it — travel when a new password is being set; a present-but-empty current_password is rejected by the backend.
  if (form.value.password) {
    payload.current_password = form.value.current_password;
    payload.password = form.value.password;
    payload.password_confirmation = form.value.password_confirmation;
  }

  updateProfile(payload);
}

// * Window-level so Esc cancels editing even when focus has left the card.
onKeyStroke('Escape', () => {
  if (editMode.value) resetForm();
});
</script>
