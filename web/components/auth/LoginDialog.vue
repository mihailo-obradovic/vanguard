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
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-between gap-4">
        <div class="text-muted flex flex-col items-start gap-1 text-sm">
          <NuxtLink to="/register" class="hover:text-primary">
            {{ $t('auth.login.noAccount') }} {{ $t('auth.login.registerLink') }}
          </NuxtLink>

          <NuxtLink to="/forgot-password" class="hover:text-primary">
            {{ $t('auth.login.forgotPasswordLink') }}
          </NuxtLink>
        </div>

        <div class="flex gap-2">
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
              isLoggingIn
                ? $t('auth.login.submitting')
                : $t('auth.login.submit')
            }}
          </u-button>
        </div>
      </div>
    </template>
  </u-modal>
</template>

<script setup lang="ts">
import { required } from '@regle/rules';

import { useLogIn } from '@/services/queries/useAuthQueries';

import type { User } from '@/types/auth';

const emit = defineEmits<{ close: [user?: User] }>();

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
