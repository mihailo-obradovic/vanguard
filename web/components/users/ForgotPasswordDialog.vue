<template>
  <FormDialog
    v-model="dialog"
    :confirm-disabled="r$.$invalid"
    :loading="loading"
    :title="$t('auth.forgotPassword.title')"
    @cancel="handleCancel"
    @confirm="handleConfirm"
    @after-leave="handleAfterLeave"
  >
    <p class="text-muted-foreground text-sm">
      {{ $t('auth.forgotPassword.hint') }}
    </p>

    <UIField
      v-model="form.email"
      :label="$t('common.fields.email')"
      :errors="r$.email.$errors"
      type="email"
      required
    />

    <Button
      type="button"
      variant="link"
      size="sm"
      class="h-auto justify-start p-0"
      @click="handleBackToLogin"
    >
      {{ $t('auth.backToLogin') }}
    </Button>
  </FormDialog>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button';

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
  confirm: [form: { email: string }];
  backToLogin: [];
}>();

const dialog = defineModel<boolean>({ required: true });
// Stryker restore all

const form = ref({
  email: ''
});

const externalErrors = useExternalErrors(() => props.serverErrors);

const { r$ } = useRegle(
  form,
  {
    ...credentialEmailRules()
  },
  { externalErrors }
);

const { handleCancel, handleConfirm, handleAfterLeave } = useDialogForm(
  dialog,
  r$,
  { form, onSubmit: (values) => emit('confirm', values) }
);

function handleBackToLogin() {
  dialog.value = false;

  emit('backToLogin');
}
</script>
