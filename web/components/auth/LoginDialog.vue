<template>
  <u-modal
    :open="open"
    :title="$t('auth.login.title')"
    @update:open="handleOpenChange"
  >
    <template #body>
      <form id="login-form" class="space-y-4" @submit.prevent="handleSubmit">
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
            autocomplete="current-password"
            class="w-full"
          />
        </u-form-field>
      </form>

      <div class="flex w-full flex-col items-start justify-center gap-1 pt-4">
        <u-button
          variant="link"
          size="sm"
          @click="emit('close', 'register')"
          class="self-center"
        >
          {{ $t('auth.login.noAccount') }} {{ $t('auth.login.registerLink') }}
        </u-button>

        <u-button
          class="self-center"
          variant="link"
          size="sm"
          @click="emit('close', 'forgot-password')"
        >
          {{ $t('auth.login.forgotPasswordLink') }}
        </u-button>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <u-button color="neutral" variant="outline" @click="emit('close')">
          {{ $t('common.actions.cancel') }}
        </u-button>

        <u-button
          type="submit"
          form="login-form"
          :loading="isLoggingIn"
          :disabled="r$.$invalid"
        >
          {{
            isLoggingIn ? $t('auth.login.submitting') : $t('auth.login.submit')
          }}
        </u-button>
      </div>
    </template>
  </u-modal>
</template>

<script setup lang="ts">
import { required } from '@regle/rules';

import { useLogIn } from '@/services/queries/useAuthQueries';

import type { AuthDialog, User } from '@/types/auth';

const emit = defineEmits<{ close: [result?: User | AuthDialog] }>();

const open = defineModel<boolean>('open', { default: false });

const form = ref({ email: 'test@example.com', password: 'gmaz1234' });

const {
  mutate: logIn,
  isLoading: isLoggingIn,
  error: loginError
} = useLogIn({
  errorHandling: { hideValidationToast: true },
  onSuccess: (user) => emit('close', user)
});

const { r$ } = useRegle(
  form,
  {
    ...credentialEmailRules(),
    password: labeledRules('validation.fieldNames.password', { required })
  },
  { externalErrors: useExternalErrors(useValidationErrors(loginError)) }
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
    logIn(form.value);
  }
}
</script>
