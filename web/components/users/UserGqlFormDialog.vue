<template>
  <u-modal
    :open="open"
    :title="$t('graphqlDemo.editTitle', { name: user.name })"
    @update:open="handleOpenChange"
  >
    <template #body>
      <form
        id="user-gql-form"
        class="space-y-4"
        novalidate
        @submit.prevent="handleSubmit"
      >
        <u-form-field
          :label="$t('common.fields.name')"
          :error="r$.name.$errors[0]"
        >
          <u-input v-model="form.name" class="w-full" />
        </u-form-field>

        <u-form-field
          :label="$t('common.fields.email')"
          :error="r$.email.$errors[0]"
        >
          <u-input v-model="form.email" type="email" class="w-full" />
        </u-form-field>

        <u-form-field :label="$t('common.fields.role')">
          <u-select
            v-model="form.role"
            :items="roleItems"
            value-key="value"
            class="w-full"
          />
        </u-form-field>
      </form>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <u-button color="neutral" variant="outline" @click="emit('close')">
          {{ $t('common.actions.cancel') }}
        </u-button>

        <u-button
          type="submit"
          form="user-gql-form"
          :loading="isUpdating"
          :disabled="r$.$invalid"
        >
          {{
            isUpdating
              ? $t('common.actions.saving')
              : $t('users.form.submitUpdate')
          }}
        </u-button>
      </div>
    </template>
  </u-modal>
</template>

<script setup lang="ts">
import { email, maxLength, required } from '@regle/rules';

import { useUpdateUserGql } from '@/services/queries/useUserGqlQueries';

import type { User } from '@/types/auth';

const props = defineProps<{ user: User }>();

const emit = defineEmits<{ close: [result?: User] }>();

const open = defineModel<boolean>('open', { default: false });

const { t } = useI18n();

const roleItems = computed(() => [
  { label: t('users.roles.user'), value: 'user' },
  { label: t('users.roles.admin'), value: 'admin' }
]);

const form = ref(formFor(props.user));

const {
  mutate: updateUser,
  isLoading: isUpdating,
  error: updateError
} = useUpdateUserGql({
  errorHandling: { hideValidationToast: true },
  onSuccess: (updated) => {
    $toast(t('users.toasts.updated', { name: updated.name }), 'success');
    emit('close', updated);
  }
});

// * Mirrors the GraphQL validator, which has no password field and no availability hint — the REST form's `accountEmailRules` would promise checks this endpoint does not make.
const { r$ } = useRegle(
  form,
  {
    ...nameRules(),
    email: labeledRules('validation.fieldNames.email', {
      required,
      email,
      maxLength: maxLength(255)
    })
  },
  { externalErrors: useExternalErrors(useValidationErrors(updateError)) }
);

function formFor(user: User) {
  return {
    name: user.name,
    email: user.email,
    role: user.role
  };
}

function handleOpenChange(next: boolean) {
  open.value = next;

  if (!next) {
    emit('close');
  }
}

async function handleSubmit() {
  const { valid } = await r$.$validate();

  if (!valid) return;

  // * Partial update: only the fields the admin actually changed go on the wire — omitted GraphQL variables never reach the resolver, so untouched fields keep their values.
  updateUser({
    id: props.user.id,
    ...changedFields(props.user, form.value)
  });
}
</script>
