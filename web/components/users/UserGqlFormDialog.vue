<template>
  <FormDialog
    :model-value="user !== null"
    :title="$t('graphqlDemo.editTitle', { name: user?.name ?? '' })"
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
        :disabled="submitting"
        v-bind="email.control"
      />

      <FieldError :id="email.errorId" :errors="email.errors" />
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
            idle: $t('users.form.submitUpdate'),
            saving: $t('common.actions.saving')
          }"
          :active="submitting ? 'saving' : 'idle'"
        />
      </Button>
    </template>
  </FormDialog>
</template>

<script setup lang="ts">
import { email as emailRule, maxLength, required } from '@regle/rules';
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
import type { UpdateUserGqlInput } from '@/types/user';

const props = defineProps<{
  // * The user being edited — and the open state: this dialog only ever edits, so a subject and an open flag would be the same fact stated twice.
  user: User | null;
  submitting: boolean;
  // * The owning page's 422 map (`useValidationErrors`), mirrored into Regle here.
  serverErrors: Record<string, string[]>;
}>();

const emit = defineEmits<{
  update: [input: UpdateUserGqlInput];
  close: [];
}>();

const form = ref(formFor(props.user));

// * Mirrors the GraphQL validator, which has no password field and no availability hint — the REST form's `accountEmailRules` would promise checks this endpoint does not make.
const { r$ } = useRegle(
  form,
  {
    ...nameRules(),
    email: labeledRules('validation.fieldNames.email', {
      required,
      email: emailRule,
      maxLength: maxLength(255)
    })
  },
  { externalErrors: useExternalErrors(() => props.serverErrors) }
);

const { t } = useI18n();

const name = useFieldAria(() => r$.name.$errors);
const email = useFieldAria(() => r$.email.$errors);

// * The role field carries no rules of its own, so it needs an id for the label pairing and nothing else.
const roleId = useId();

// * Passed explicitly rather than left to `SelectValue`'s own lookup, which resolves through the items and reads empty until the list has been opened once.
const roleLabel = computed(() =>
  form.value.role === 'admin' ? t('users.roles.admin') : t('users.roles.user')
);

// * The dialog owns its own dismissal (Escape, the overlay, Cancel); all of them arrive here.
function handleOpenChange(open: boolean) {
  if (!open) {
    emit('close');
  }
}

function formFor(user: User | null) {
  return {
    name: user?.name ?? '',
    email: user?.email ?? '',
    role: user?.role ?? ('user' as User['role'])
  };
}

async function handleSubmit() {
  const { valid } = await r$.$validate();

  if (!valid || !props.user) {
    return;
  }

  // * Partial update: only the fields the admin actually changed go on the wire — omitted GraphQL variables never reach the resolver, so untouched fields keep their values.
  emit('update', {
    id: props.user.id,
    ...changedFields(props.user, form.value)
  });
}

// * Keyed on the subject rather than an open flag, since here they are the same thing.
watch(
  () => props.user,
  (user) => {
    if (!user) {
      return;
    }

    r$.$reset({ toState: formFor(user), clearExternalErrors: true });
  }
);
</script>
