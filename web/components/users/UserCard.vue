<template>
  <v-row no-gutters>
    <v-col cols="12" md="6">
      <GapContainer type="VSheet" class="pa-4 rounded-lg" column elevation="1">
        <GapContainer class="justify-space-between mb-2">
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
              <v-icon :icon="mdiCheck" color="white" />
            </v-btn>
          </GapContainer>
        </GapContainer>

        <GapContainer column class="w-100">
          <v-text-field
            v-model="form.name"
            label="Name"
            variant="outlined"
            :readonly="!editMode"
          />

          <v-text-field
            v-model="form.email"
            label="Email"
            variant="outlined"
            :readonly="!editMode"
          />

          <template v-if="editMode">
            <PasswordField
              v-model="form.current_password"
              label="Current password"
              variant="outlined"
            />

            <PasswordField
              v-model="form.password"
              v-model:visible="showNewPassword"
              label="New password (optional)"
              variant="outlined"
            />

            <PasswordField
              v-model="form.password_confirmation"
              v-model:visible="showNewPassword"
              label="Confirm new password"
              variant="outlined"
            />
          </template>

          <GapContainer class="align-center justify-space-between">
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
        </GapContainer>
      </GapContainer>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { mdiCheck, mdiClose, mdiPencil } from '@mdi/js';

import { useResendEmailVerification } from '@/services/queries/useAuthQueries';

import type { ProfileForm } from '@/types/user';

withDefaults(defineProps<{ loading?: boolean }>(), { loading: false });

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

function resetForm() {
  editMode.value = false;

  Object.assign(form.value, initialForm.value);
}

function handleSubmit() {
  if (!form.value.name || !form.value.email || !form.value.current_password) {
    $toast('Please fill in all required fields', 'error');
    return;
  }

  if (
    form.value.password &&
    form.value.password !== form.value.password_confirmation
  ) {
    $toast('Password confirmation does not match', 'error');
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
