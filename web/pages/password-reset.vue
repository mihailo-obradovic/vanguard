<template>
  <v-card color="background" width="450px">
    <v-card-title class="pa-4 pb-2">Generate new password</v-card-title>

    <v-card-text class="px-4 py-2">
      <input type="hidden" name="token" :value="form.token" />

      <v-text-field v-model="form.email" label="Email" type="email" readonly />

      <PasswordField
        v-model="form.password"
        v-model:visible="showPassword"
        label="Password"
        required
      />

      <PasswordField
        v-model="form.password_confirmation"
        v-model:visible="showPassword"
        label="Confirm Password"
        required
      />
    </v-card-text>

    <v-card-actions class="pa-4 pt-2">
      <slot name="actions">
        <v-row no-gutters class="d-flex ga-4">
          <v-col>
            <v-btn block variant="outlined" @click="handleCancel">Cancel</v-btn>
          </v-col>

          <v-col>
            <v-btn
              :disabled="!isFormValid"
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

const isFormValid = computed(() => {
  const isFormFilled = Object.values(form.value).every(Boolean);

  const doPasswordsMatch =
    form.value.password === form.value.password_confirmation;

  return isFormFilled && doPasswordsMatch;
});

function handleCancel() {
  navigateTo('/');
}

const { mutate: resetPassword, isLoading: isResetting } = useResetPassword({
  onSuccess: (data) => {
    $toast(data.status, 'success');
    navigateTo('/');
  }
});

function handleConfirm() {
  resetPassword(form.value);
}
</script>
