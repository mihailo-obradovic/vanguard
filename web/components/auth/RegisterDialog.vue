<template>
  <u-modal
    :open="open"
    :title="$t('auth.register.title')"
    @update:open="handleOpenChange"
  >
    <template #body>
      <form id="register-form" class="space-y-4" @submit.prevent="handleSubmit">
        <u-form-field
          :label="$t('common.fields.name')"
          :error="r$.name.$errors[0]"
          required
        >
          <u-input v-model="form.name" autocomplete="name" class="w-full" />
        </u-form-field>

        <u-form-field
          :label="$t('common.fields.email')"
          :error="r$.email.$errors[0]"
          required
        >
          <u-input
            v-model="form.email"
            type="email"
            autocomplete="email"
            class="w-full"
          />
        </u-form-field>

        <u-form-field
          :label="$t('common.fields.password')"
          :error="r$.password.$errors[0]"
          required
        >
          <u-input
            v-model="form.password"
            type="password"
            autocomplete="new-password"
            class="w-full"
          />
        </u-form-field>

        <u-form-field
          :label="$t('common.fields.passwordConfirmation')"
          :error="r$.password_confirmation.$errors[0]"
          required
        >
          <u-input
            v-model="form.password_confirmation"
            type="password"
            autocomplete="new-password"
            class="w-full"
          />
        </u-form-field>
      </form>
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-between gap-4">
        <u-button variant="link" size="sm" @click="emit('close', 'login')">
          {{ $t('auth.register.haveAccount') }} {{ $t('auth.loginLink') }}
        </u-button>

        <div class="flex gap-2">
          <u-button color="neutral" variant="outline" @click="emit('close')">
            {{ $t('common.actions.cancel') }}
          </u-button>

          <u-button
            type="submit"
            form="register-form"
            :loading="isRegistering"
            :disabled="r$.$invalid"
          >
            {{
              isRegistering
                ? $t('auth.register.submitting')
                : $t('auth.register.submit')
            }}
          </u-button>
        </div>
      </div>
    </template>
  </u-modal>
</template>

<script setup lang="ts">
import { maxLength, required } from '@regle/rules';

import { useRegister } from '@/services/queries/useAuthQueries';

import type { AuthDialog, User } from '@/types/auth';

const emit = defineEmits<{ close: [result?: User | AuthDialog] }>();

const open = defineModel<boolean>('open', { default: false });

const form = ref({
  name: '',
  email: '',
  password: '',
  password_confirmation: ''
});

const {
  mutate: register,
  isLoading: isRegistering,
  error: registerError
} = useRegister({
  errorHandling: { hideValidationToast: true },
  onSuccess: (user) => emit('close', user)
});

const { r$ } = useRegle(
  form,
  {
    name: labeledRules('validation.fieldNames.name', {
      required,
      maxLength: maxLength(255)
    }),
    ...accountEmailRules(),
    ...newPasswordRules(() => form.value.password)
  },
  { externalErrors: useExternalErrors(useValidationErrors(registerError)) }
);

function handleOpenChange(next: boolean) {
  open.value = next;

  if (!next) {
    emit('close');
  }
}

async function handleSubmit() {
  const { valid } = await r$.$validate();

  if (valid) {
    register(form.value);
  }
}
</script>
