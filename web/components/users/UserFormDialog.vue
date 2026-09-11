<template>
  <FormDialog
    :model-value="open"
    :title="title"
    :confirm-disabled="r$.$invalid"
    :loading="submitting"
    @update:model-value="handleOpenChange"
    @cancel="emit('close')"
    @confirm="handleSubmit"
  >
    <Field :data-invalid="name.invalid">
      <FieldLabel :for="name.id">{{ $t('common.fields.name') }}</FieldLabel>

      <Input
        v-model="form.name"
        type="text"
        required
        :disabled="submitting"
        v-bind="name.control"
      />

      <FieldError :id="name.errorId" :errors="name.errors" />
    </Field>

    <Field :data-invalid="email.invalid">
      <FieldLabel :for="email.id">{{ $t('common.fields.email') }}</FieldLabel>

      <Input
        v-model="form.email"
        type="email"
        required
        :disabled="submitting"
        v-bind="email.control"
      />

      <FieldError :id="email.errorId" :errors="email.errors" />
    </Field>

    <Field :data-invalid="password.invalid">
      <FieldLabel :for="password.id">{{ passwordLabel }}</FieldLabel>

      <Input
        v-model="form.password"
        type="password"
        :required="!isEdit"
        :disabled="submitting"
        v-bind="password.control"
      />

      <FieldError :id="password.errorId" :errors="password.errors" />
    </Field>

    <Field :data-invalid="confirmation.invalid">
      <FieldLabel :for="confirmation.id">
        {{ passwordConfirmationLabel }}
      </FieldLabel>

      <Input
        v-model="form.password_confirmation"
        type="password"
        :required="!isEdit || !!form.password"
        :disabled="submitting"
        v-bind="confirmation.control"
      />

      <FieldError :id="confirmation.errorId" :errors="confirmation.errors" />
    </Field>

    <Field>
      <FieldLabel :for="roleId">{{ $t('common.fields.role') }}</FieldLabel>

      <Select v-model="form.role" :disabled="submitting">
        <SelectTrigger :id="roleId" class="w-full">
          <SelectValue>{{ roleLabel }}</SelectValue>
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="user">{{ $t('users.roles.user') }}</SelectItem>

          <SelectItem value="admin">{{ $t('users.roles.admin') }}</SelectItem>
        </SelectContent>
      </Select>
    </Field>

    <template #actions>
      <Button
        variant="outline"
        class="flex-1"
        :disabled="submitting"
        @click="emit('close')"
      >
        {{ $t('common.actions.cancel') }}
      </Button>

      <Button
        class="flex-1"
        :disabled="submitting || r$.$invalid"
        @click="handleSubmit"
      >
        <UIReservedLabel
          :variants="{
            create: $t('users.form.submitCreate'),
            update: $t('users.form.submitUpdate'),
            saving: $t('common.actions.saving')
          }"
          :active="submitting ? 'saving' : isEdit ? 'update' : 'create'"
        />
      </Button>
    </template>
  </FormDialog>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import type { User } from '@/types/auth';
import type { CreateUserForm, UpdateUserForm } from '@/types/user';

const props = defineProps<{
  open: boolean;
  // * The user being edited, or `null` to create one — the only thing that decides the dialog's mode.
  user: User | null;
  submitting: boolean;
  // * The owning page's 422 map (`useValidationErrors`), mirrored into Regle here.
  serverErrors: Record<string, string[]>;
}>();

const emit = defineEmits<{
  create: [payload: CreateUserForm];
  update: [id: number, payload: UpdateUserForm];
  close: [];
}>();

const { t } = useI18n();

const form = ref<CreateUserForm>(blankForm());

const isEdit = computed(() => props.user !== null);

// * Create requires a password; edit only validates one when entered.
const { r$ } = useRegle(
  form,
  () => ({
    ...nameRules(),
    ...accountEmailRules(() => props.user?.id),
    ...newPasswordRules(
      () => form.value.password,
      () => (isEdit.value ? 'change' : 'set')
    )
  }),
  { externalErrors: useExternalErrors(() => props.serverErrors) }
);

const name = useFieldAria(() => r$.name.$errors);
const email = useFieldAria(() => r$.email.$errors);
const password = useFieldAria(() => r$.password.$errors);
const confirmation = useFieldAria(() => r$.password_confirmation.$errors);

// * The role field carries no rules of its own, so it needs an id for the label pairing and nothing else.
const roleId = useId();

// * Passed explicitly rather than left to `SelectValue`'s own lookup, which resolves through the items and reads empty until the list has been opened once.
const roleLabel = computed(() =>
  form.value.role === 'admin' ? t('users.roles.admin') : t('users.roles.user')
);

const title = computed(() =>
  isEdit.value ? t('users.form.editTitle') : t('users.create')
);

// * Edit is a change-password form: both password labels carry the "optional" hint the mandatory pair does not.
const passwordLabel = computed(() =>
  isEdit.value
    ? `${t('common.fields.password')} ${t('users.form.passwordHint')}`
    : t('common.fields.password')
);

const passwordConfirmationLabel = computed(() =>
  isEdit.value
    ? `${t('common.fields.passwordConfirmation')} ${t('users.form.passwordConfirmationHint')}`
    : t('common.fields.passwordConfirmation')
);

function blankForm(): CreateUserForm {
  return {
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'user'
  };
}

function formFor(user: User | null): CreateUserForm {
  if (!user) {
    return blankForm();
  }

  return {
    ...blankForm(),
    name: user.name,
    email: user.email,
    role: user.role
  };
}

// ! The backend reads a present password as a change request, so an untouched pair must not travel —
// ! and a present-but-empty one is rejected outright.
function updatePayloadFrom(values: CreateUserForm): UpdateUserForm {
  const payload: UpdateUserForm = {
    name: values.name,
    email: values.email,
    role: values.role
  };

  if (!values.password) {
    return payload;
  }

  return {
    ...payload,
    password: values.password,
    password_confirmation: values.password_confirmation
  };
}

// * The dialog owns its own dismissal (Escape, the overlay, Cancel); all of them arrive here.
function handleOpenChange(open: boolean) {
  if (!open) {
    emit('close');
  }
}

async function handleSubmit() {
  const { valid } = await r$.$validate();

  if (!valid) {
    return;
  }

  if (!props.user) {
    emit('create', { ...form.value });

    return;
  }

  emit('update', props.user.id, updatePayloadFrom(form.value));
}

// * Reset on open rather than on close: the fresh state depends on the `user` the page assigns right before opening, and this dialog has no after-close hook to reset from (`catalyst/stacks/frontend/nuxt/validation.md`).
watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }

    r$.$reset({ toState: formFor(props.user), clearExternalErrors: true });
  },
  // * Immediate, so a dialog mounted already open is seeded too — the page's own flag starts false, but nothing about the contract should depend on that.
  { immediate: true }
);
</script>
