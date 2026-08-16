<template>
  <v-row no-gutters>
    <v-col cols="12" md="6">
      <GapContainer
        type="VSheet"
        class="pa-4 rounded-lg"
        column
        elevation="1"
        @keydown.enter="handleEnterKey"
      >
        <GapContainer class="justify-space-between align-center mb-2">
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

        <GapContainer column class="w-100">
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

          <template v-if="editMode">
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
              variant="outlined"
            />

            <PasswordField
              v-model="form.password_confirmation"
              v-model:visible="showNewPassword"
              :error-messages="r$.password_confirmation.$errors"
              :label="$t('common.fields.confirmNewPassword')"
              variant="outlined"
            />
          </template>
        </GapContainer>
      </GapContainer>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { mdiCheck, mdiClose, mdiPencil } from '@mdi/js';
import { maxLength, required, requiredIf } from '@regle/rules';

import { useResendEmailVerification } from '@/services/queries/useAuthQueries';

import type { ProfileForm } from '@/types/user';

// ! Stryker instruments this block with locally declared coverage helpers, and a compiler
// ! macro is hoisted out of setup() — referencing them there is a compile error, not a
// ! warning. The defaults inside go unmutated as a result (`catalyst/operations.md`).
// Stryker disable all
const props = withDefaults(
  defineProps<{
    loading?: boolean;
    serverErrors?: Record<string, string[]>;
  }>(),
  { loading: false, serverErrors: () => ({}) }
);

const emit = defineEmits<{
  update: [form: ProfileForm];
}>();
// Stryker restore all

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

const externalErrors = useExternalErrors(() => props.serverErrors);

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
    ...newPasswordRules(() => form.value.password, true)
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

  emit('update', updateData);
}

const handleEnterKey = useConfirmOnEnter(handleSubmit, () => editMode.value);

// * Window-level so Esc cancels editing even when focus has left the card
onKeyStroke('Escape', () => {
  if (editMode.value) {
    resetForm();
  }
});

defineExpose({ resetForm });
</script>
