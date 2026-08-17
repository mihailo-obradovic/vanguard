<template>
  <UIDialog
    :open="user !== null"
    :title="$t('graphqlDemo.editTitle', { name: user?.name ?? '' })"
    @close="emit('close')"
  >
    <form class="user-form" novalidate @submit.prevent="handleSubmit">
      <UIField
        v-model="form.name"
        :label="$t('common.fields.name')"
        :errors="r$.name.$errors"
        type="text"
        :disabled="submitting"
      />

      <UIField
        v-model="form.email"
        :label="$t('common.fields.email')"
        :errors="r$.email.$errors"
        type="email"
        :disabled="submitting"
      />

      <UIField :label="$t('common.fields.role')">
        <template #default="{ controlId }">
          <select
            :id="controlId"
            v-model="form.role"
            class="ui-field-control"
            :disabled="submitting"
          >
            <option value="user">{{ $t('users.roles.user') }}</option>

            <option value="admin">{{ $t('users.roles.admin') }}</option>
          </select>
        </template>
      </UIField>

      <UIDialogActions>
        <button
          type="button"
          class="cancel-btn"
          :disabled="submitting"
          @click="emit('close')"
        >
          {{ $t('common.actions.cancel') }}
        </button>

        <button
          type="submit"
          class="submit-btn"
          :disabled="submitting || r$.$invalid"
        >
          {{
            submitting
              ? $t('common.actions.saving')
              : $t('users.form.submitUpdate')
          }}
        </button>
      </UIDialogActions>
    </form>
  </UIDialog>
</template>

<script setup lang="ts">
import { email, maxLength, required } from '@regle/rules';

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
    name: labeledRules('validation.fieldNames.name', {
      required,
      maxLength: maxLength(255)
    }),
    email: labeledRules('validation.fieldNames.email', {
      required,
      email,
      maxLength: maxLength(255)
    })
  },
  { externalErrors: useExternalErrors(() => props.serverErrors) }
);

function formFor(user: User | null) {
  return {
    name: user?.name ?? '',
    email: user?.email ?? '',
    role: user?.role ?? ('user' as User['role'])
  };
}

async function handleSubmit() {
  const { valid } = await r$.$validate();

  if (!valid || !props.user) return;

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
    if (!user) return;

    r$.$reset({ toState: formFor(user), clearExternalErrors: true });
  }
);
</script>

<style scoped>
.user-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cancel-btn {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.25s ease;
}

.cancel-btn:hover {
  background-color: #5a6268;
}

.submit-btn {
  background-color: rgb(0, 102, 255);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.25s ease;
}

.submit-btn:hover:not(:disabled) {
  background-color: rgba(0, 102, 255, 0.9);
}

.submit-btn:disabled,
.cancel-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
