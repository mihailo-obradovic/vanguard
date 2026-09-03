<template>
  <v-row no-gutters class="user-card-row">
    <v-col cols="12" md="6" class="user-card-col d-flex">
      <!-- * The edit, save and cancel controls live in the header, so the fields are what scroll — a card that scrolled whole would carry them off the screen. -->
      <GapContainer
        type="VSheet"
        class="user-card w-100 pa-4 rounded-lg"
        column
        elevation="1"
        @keydown.enter="handleEnterKey"
      >
        <GapContainer class="justify-space-between align-center mb-2 flex-0-0">
          <h2>{{ $t('profile.title') }}</h2>

          <GapContainer>
            <v-btn
              v-if="editMode"
              :aria-label="$t('common.actions.cancel')"
              class="rounded"
              icon
              variant="flat"
              color="error"
              size="small"
              @click="resetForm"
            >
              <v-icon :icon="mdiClose" />
            </v-btn>

            <v-btn
              v-if="!editMode"
              :aria-label="$t('common.actions.edit')"
              class="rounded"
              icon
              variant="flat"
              color="primary"
              size="small"
              @click="editMode = true"
            >
              <v-icon :icon="mdiPencil" />
            </v-btn>

            <v-btn
              v-else
              :aria-label="$t('common.actions.save')"
              class="rounded"
              icon
              variant="flat"
              color="success"
              size="small"
              :loading="loading"
              @click="handleSubmit"
            >
              <v-icon :icon="mdiCheck" />
            </v-btn>
          </GapContainer>
        </GapContainer>

        <GapContainer column class="user-card-fields w-100">
          <v-text-field
            v-model="form.name"
            :error-messages="r$.name.$errors"
            :label="$t('common.fields.name')"
            variant="outlined"
            :readonly="!editMode"
          />

          <v-text-field
            v-model="form.email"
            :error-messages="r$.email.$errors"
            :label="$t('common.fields.email')"
            variant="outlined"
            :readonly="!editMode"
          />

          <GapContainer class="align-center">
            <v-chip
              :color="user?.email_verified_at ? 'success' : 'warning'"
              variant="flat"
              size="small"
            >
              {{
                user?.email_verified_at
                  ? $t('profile.info.verified')
                  : $t('profile.info.notVerified')
              }}
            </v-chip>

            <v-btn
              v-if="!user?.email_verified_at"
              variant="text"
              size="small"
              color="primary"
              :loading="isResending"
              @click="resendVerification()"
            >
              {{ $t('profile.info.resend') }}
            </v-btn>
          </GapContainer>

          <!-- * The password fields arrive and leave together, so the card grows and shrinks rather
               than snapping. `v-expand-transition` animates height, needs a single child — hence the
               `GapContainer` wrapper, which also keeps the gap between the three fields — and
               disables itself under `prefers-reduced-motion` on its own (§14.4). -->
          <v-expand-transition>
            <GapContainer v-if="editMode" column class="w-100">
              <PasswordField
                v-model="form.current_password"
                :error-messages="r$.current_password.$errors"
                :label="$t('common.fields.currentPassword')"
                variant="outlined"
              />

              <PasswordField
                v-model="form.password"
                v-model:visible="showNewPassword"
                :error-messages="r$.password.$errors"
                :label="$t('common.fields.newPassword')"
                :hint="$t('common.fields.newPasswordHint')"
                persistent-hint
                variant="outlined"
              />

              <PasswordField
                v-model="form.password_confirmation"
                v-model:visible="showNewPassword"
                :error-messages="r$.password_confirmation.$errors"
                :label="$t('common.fields.confirmNewPassword')"
                variant="outlined"
              />
            </GapContainer>
          </v-expand-transition>
        </GapContainer>
      </GapContainer>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { mdiCheck, mdiClose, mdiPencil } from '@mdi/js';
import { maxLength, required, requiredIf } from '@regle/rules';

import {
  useResendEmailVerification,
  useUpdateProfile
} from '@/services/queries/useAuthQueries';

import type { ProfileForm } from '@/types/user';

const { t } = useI18n();

const { user } = storeToRefs(useAuthStore());

const editMode = ref(false);

const showNewPassword = ref(false);

const { mutate: resendVerification, isLoading: isResending } =
  useResendEmailVerification({
    onSuccess: () => {
      $toast(t('profile.toasts.verificationSent'), 'success');
    }
  });

const initialForm = computed(() => {
  return {
    name: user.value?.name || '',
    email: user.value?.email || '',
    current_password: '',
    password: '',
    password_confirmation: ''
  };
});

const form = ref(Object.assign({}, initialForm.value));

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
  {
    ...nameRules(),
    // * The signed-in user already owns their own address, so the check has to ignore them.
    ...accountEmailRules(() => user.value?.id),
    current_password: labeledRules('validation.fieldNames.currentPassword', {
      requiredIf: requiredIf(() => !!form.value.password)
    }),
    ...newPasswordRules(() => form.value.password, 'change')
  },
  { externalErrors }
);

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

const handleEnterKey = useConfirmOnEnter(handleSubmit, () => editMode.value);

// * Window-level so Esc cancels editing even when focus has left the card
onKeyStroke('Escape', () => {
  if (editMode.value) {
    resetForm();
  }
});
</script>

<style scoped>
/* ! `min-height: 0` is what hands the overflow to the fields: a flex child's default
   `min-height: auto` refuses to shrink below its content, so the card would spill past the page
   instead — and with the page itself unscrollable, spilled content is unreachable. */
/* ! `flex-wrap: nowrap` matters as much: a wrapping row sizes its line to the tallest item and
   lets it overflow rather than shrinking it, so the chain stops dead at the column. One column
   here, so nothing wraps either way. */
.user-card-row {
  min-height: 0;
  flex-wrap: nowrap;
}

.user-card-col {
  min-height: 0;
}

/* * `align-self` and `max-height` rather than stretching: the card keeps hugging its content, but
   may now shrink to the column instead of growing past it, which is what hands its own fields the
   overflow. */
.user-card {
  min-height: 0;
  align-self: flex-start;
  max-height: 100%;
}

/* ! The padding is not decoration: a floating field label sits above its own border box, so the
   first field's label is clipped by this container's top edge without room reserved for it. */
.user-card-fields {
  min-height: 0;
  overflow-y: auto;
  padding-top: 10px;
}
</style>
