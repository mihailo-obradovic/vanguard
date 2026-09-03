<template>
  <u-modal
    :open="open"
    :title="$t('auth.forgotPassword.title')"
    :description="$t('auth.forgotPassword.hint')"
    @update:open="handleOpenChange"
  >
    <template #body>
      <form id="forgot-password-form" @submit.prevent="handleSubmit">
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
      </form>
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-between gap-4">
        <u-button variant="link" size="sm" @click="emit('close', 'login')">
          {{ $t('auth.rememberedPassword') }} {{ $t('auth.loginLink') }}
        </u-button>

        <div class="flex gap-2">
          <u-button color="neutral" variant="outline" @click="emit('close')">
            {{ $t('common.actions.cancel') }}
          </u-button>

          <u-button
            type="submit"
            form="forgot-password-form"
            :loading="isSending"
            :disabled="r$.$invalid"
          >
            {{
              isSending
                ? $t('auth.forgotPassword.submitting')
                : $t('auth.forgotPassword.submit')
            }}
          </u-button>
        </div>
      </div>
    </template>
  </u-modal>
</template>

<script setup lang="ts">
import { useGeneratePasswordResetEmail } from '@/services/queries/useAuthQueries';

import type { AuthDialog } from '@/types/auth';

const emit = defineEmits<{ close: [result?: AuthDialog] }>();

// ! A compiler macro's arguments are hoisted out of setup(), away from Stryker's locally declared helpers — instrumenting them breaks the component at import time (`catalyst/operations.md`).
// Stryker disable all
const open = defineModel<boolean>('open', { default: false });
// Stryker restore all

const form = ref({ email: '' });

const {
  mutate: sendResetLink,
  isLoading: isSending,
  error: sendError
} = useGeneratePasswordResetEmail({
  errorHandling: { suppressToasts: 'validation' },
  onSuccess: (data) => {
    $toast(data.status, 'success');
    emit('close');
  }
});

const { r$ } = useRegle(
  form,
  { ...credentialEmailRules() },
  { externalErrors: useExternalErrors(useValidationErrors(sendError)) }
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
    sendResetLink(form.value);
  }
}
</script>
