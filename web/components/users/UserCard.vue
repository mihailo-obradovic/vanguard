<template>
  <v-row no-gutters>
    <v-col cols="12" md="6">
      <GapContainer type="VSheet" class="pa-4 rounded-lg" column elevation="1">
        <GapContainer class="justify-space-between align-center mb-2">
          <h2>Profile</h2>

          <GapContainer>
            <v-btn
              v-if="editMode"
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
            label="Name"
            variant="outlined"
            :readonly="!editMode"
          />

          <v-text-field
            v-model="form.email"
            :error-messages="r$.email.$errors"
            label="Email"
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
                  ? 'Email verified'
                  : 'Email not verified'
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
              Resend email
            </v-btn>
          </GapContainer>

          <template v-if="editMode">
            <PasswordField
              v-model="form.current_password"
              :error-messages="r$.current_password.$errors"
              label="Current password"
              variant="outlined"
            />

            <PasswordField
              v-model="form.password"
              v-model:visible="showNewPassword"
              :error-messages="r$.password.$errors"
              label="New password (optional)"
              variant="outlined"
            />

            <PasswordField
              v-model="form.password_confirmation"
              v-model:visible="showNewPassword"
              :error-messages="r$.password_confirmation.$errors"
              label="Confirm new password"
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
import {
  email,
  maxLength,
  minLength,
  required,
  requiredIf,
  sameAs
} from '@regle/rules';

import { useResendEmailVerification } from '@/services/queries/useAuthQueries';

import type { ProfileForm } from '@/types/user';

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

const { user } = storeToRefs(useAuthStore());

const editMode = ref(false);

const showNewPassword = ref(false);

const { mutate: resendVerification, isLoading: isResending } =
  useResendEmailVerification({
    onSuccess: () => {
      $toast('Verification email sent. Check your inbox.', 'success');
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
    name: { required, maxLength: maxLength(255) },
    email: { required, email, maxLength: maxLength(255) },
    current_password: { requiredIf: requiredIf(() => !!form.value.password) },
    password: { minLength: minLength(8) },
    password_confirmation: {
      requiredIf: requiredIf(() => !!form.value.password),
      sameAs: sameAs(() => form.value.password, 'password')
    }
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
    email: form.value.email,
    current_password: form.value.current_password
  };

  if (form.value.password) {
    updateData.password = form.value.password;
    updateData.password_confirmation = form.value.password_confirmation;
  }

  emit('update', updateData);
}

defineExpose({ resetForm });
</script>
