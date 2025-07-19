<template>
  <v-card color="background" width="450px">
    <v-card-title class="pa-4 pb-2">Generate new password</v-card-title>

    <v-card-text class="px-4 py-2">
      <input type="hidden" name="token" :value="form.token" />

      <v-text-field v-model="form.email" label="Email" type="email" readonly />

      <v-text-field
        v-model="form.password"
        label="Password"
        type="password"
        required
      />

      <v-text-field
        v-model="form.password_confirmation"
        label="Confirm Password"
        type="password"
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
              :loading="isLoading['dialog']"
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

<script setup>
import { resetPassword } from '@/services/auth.api';

definePageMeta({
  layout: 'empty'
});

const route = useRoute();

const { isLoading } = storeToRefs(useLoadingStore());
const { $startLoading, $stopLoading } = useLoadingStore();

const form = ref({
  token: '',
  email: '',
  password: '',
  password_confirmation: ''
});

onMounted(() => {
  form.value.token = route.params.token;

  form.value.email = route.query.email;
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

function handleConfirm() {
  $startLoading('dialog');

  resetPassword(form.value)
    .then(() => {
      $stopLoading('dialog');

      navigateTo('/');
    })
    .catch(console.error)
    .finally(() => $stopLoading('dialog'));
}
</script>
