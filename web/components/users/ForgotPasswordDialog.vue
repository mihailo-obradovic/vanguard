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

    <Field :data-invalid="email.invalid">
      <FieldLabel :for="email.id">{{ $t('common.fields.email') }}</FieldLabel>

      <Input
        v-model="form.email"
        type="email"
        required
        v-bind="email.control"
      />

      <FieldError :id="email.errorId" :errors="email.errors" />
    </Field>

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
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

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

const email = useFieldAria(() => r$.email.$errors);

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
