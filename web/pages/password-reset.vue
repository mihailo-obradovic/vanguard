<template>
  <v-card color="background" width="450px">
    <v-card-title class="pa-4 pb-2">Generate new password</v-card-title>

    <v-card-text class="px-4 py-2">
      <GapContainer column>
        <input type="hidden" name="token" :value="form.token" />

        <v-text-field
          v-model="form.email"
          :error-messages="r$.email.$errors"
          label="Email"
          type="email"
          readonly
        />

        <PasswordField
          v-model="form.password"
          v-model:visible="showPassword"
          :error-messages="r$.password.$errors"
          label="Password"
          required
        />

        <PasswordField
          v-model="form.password_confirmation"
          v-model:visible="showPassword"
          :error-messages="r$.password_confirmation.$errors"
          label="Confirm Password"
          required
        />
      </GapContainer>
    </v-card-text>

    <v-card-actions class="pa-4 pt-2">
      <slot name="actions">
        <v-row no-gutters class="d-flex ga-4">
          <v-col>
            <v-btn block variant="outlined" @click="handleCancel">Cancel</v-btn>
          </v-col>

          <v-col>
            <v-btn
              :disabled="r$.$invalid"
              :loading="isResetting"
              block
              color="primary"
              variant="flat"
              @click="handleConfirm"
            >
              Confirm
            </v-btn>
          </v-col>
        </v-row>
      </slot>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { email, required } from '@regle/rules';

import { useResetPassword } from '@/services/queries/useAuthQueries';

definePageMeta({
  layout: 'empty'
});

const route = useRoute();

const showPassword = ref(false);

const form = ref({
  token: '',
  email: '',
  password: '',
  password_confirmation: ''
});

onMounted(() => {
  form.value.token = String(route.query.token ?? '');

  form.value.email = String(route.query.email ?? '');
});

const {
  mutate: resetPassword,
  isLoading: isResetting,
  error: resetError
} = useResetPassword({
  errorHandling: { hideValidationToast: true },
  onSuccess: (data) => {
    $toast(data.status, 'success');
    navigateTo('/');
  }
});

const externalErrors = useExternalErrors(useValidationErrors(resetError));

// * An expired/invalid reset token comes back as a 422 on the email field, so it surfaces under the readonly email input.
const { r$ } = useRegle(
  form,
  {
    token: { required },
    email: { required, email },
    ...newPasswordRules(() => form.value.password)
  },
  { externalErrors }
);

function handleCancel() {
  navigateTo('/');
}

async function handleConfirm() {
  const { valid } = await r$.$validate();

  if (valid) {
    resetPassword(form.value);
  }
}
</script>
