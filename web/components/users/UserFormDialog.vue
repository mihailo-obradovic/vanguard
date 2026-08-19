<template>
  <u-modal :open="open" :title="title" @update:open="handleOpenChange">
    <template #body>
      <form
        id="user-form"
        class="space-y-4"
        novalidate
        @submit.prevent="handleSubmit"
      >
        <u-form-field
          :label="$t('common.fields.name')"
          :error="r$.name.$errors[0]"
          required
        >
          <u-input v-model="form.name" class="w-full" />
        </u-form-field>

        <u-form-field
          :label="$t('common.fields.email')"
          :error="r$.email.$errors[0]"
          required
        >
          <u-input v-model="form.email" type="email" class="w-full" />
        </u-form-field>

        <u-form-field
          :label="passwordLabel"
          :error="r$.password.$errors[0]"
          :required="!isEdit"
        >
          <u-input
            v-model="form.password"
            type="password"
            autocomplete="new-password"
            class="w-full"
          />
        </u-form-field>

        <u-form-field
          :label="passwordConfirmationLabel"
          :error="r$.password_confirmation.$errors[0]"
          :required="!isEdit || !!form.password"
        >
          <u-input
            v-model="form.password_confirmation"
            type="password"
            autocomplete="new-password"
            class="w-full"
          />
        </u-form-field>

        <!-- ! Deliberately a native <select>, and deliberately not inside <u-form-field>. Nuxt UI's select is a Reka listbox that commits through pointer-capture APIs jsdom does not implement, so no click, pointer sequence or keypress can drive it in a spec — and the role is the one field with privilege attached, where "an admin was created as a user" has to stay covered. FormField pairs its label with Nuxt UI children through provide/inject, which a native element cannot receive, so the label is paired by hand here. Styled to match the inputs above. -->
        <div>
          <label
            :for="roleId"
            class="text-default mb-1 block text-sm font-medium"
          >
            {{ $t('common.fields.role') }}
          </label>

          <select
            :id="roleId"
            v-model="form.role"
            class="ring-accented text-highlighted bg-default focus-visible:outline-primary w-full rounded-md ps-2.5 pe-8 py-1.5 text-sm ring ring-inset focus-visible:outline-2"
          >
            <option value="user">{{ $t('users.roles.user') }}</option>

            <option value="admin">{{ $t('users.roles.admin') }}</option>
          </select>
        </div>
      </form>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <u-button color="neutral" variant="outline" @click="emit('close')">
          {{ $t('common.actions.cancel') }}
        </u-button>

        <u-button
          type="submit"
          form="user-form"
          :loading="isSaving"
          :disabled="r$.$invalid"
        >
          {{
            isSaving
              ? $t('common.actions.saving')
              : isEdit
                ? $t('users.form.submitUpdate')
                : $t('users.form.submitCreate')
          }}
        </u-button>
      </div>
    </template>
  </u-modal>
</template>

<script setup lang="ts">
import {
  useCreateUser,
  useUpdateUser
} from '@/services/queries/useUserQueries';

import type { User } from '@/types/auth';
import type { CreateUserForm, UpdateUserForm } from '@/types/user';

const props = defineProps<{
  // * The user being edited, or `null` to create one — the only thing that decides the dialog's mode.
  user?: User | null;
}>();

const emit = defineEmits<{ close: [result?: User] }>();

const open = defineModel<boolean>('open', { default: false });

const { t } = useI18n();

const roleId = useId();

const form = ref<CreateUserForm>(formFor(props.user ?? null));

const isEdit = computed(() => !!props.user);

const {
  mutate: createUser,
  isLoading: isCreating,
  error: createError
} = useCreateUser({
  errorHandling: { hideValidationToast: true },
  onSuccess: (created) => {
    $toast(t('users.toasts.created', { name: created.name }), 'success');
    emit('close', created);
  }
});

const {
  mutate: updateUser,
  isLoading: isUpdating,
  error: updateError
} = useUpdateUser({
  errorHandling: { hideValidationToast: true },
  onSuccess: (updated) => {
    $toast(t('users.toasts.updated', { name: updated.name }), 'success');
    emit('close', updated);
  }
});

const isSaving = computed(() => isCreating.value || isUpdating.value);

const serverError = computed(() =>
  isEdit.value ? updateError.value : createError.value
);

// * Create requires a password; edit only validates one when entered.
const { r$ } = useRegle(
  form,
  () => ({
    ...nameRules(),
    ...accountEmailRules(() => props.user?.id),
    ...newPasswordRules(
      () => form.value.password,
      () => isEdit.value
    )
  }),
  { externalErrors: useExternalErrors(useValidationErrors(serverError)) }
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

function formFor(user: User | null): CreateUserForm {
  return {
    name: user?.name ?? '',
    email: user?.email ?? '',
    password: '',
    password_confirmation: '',
    role: user?.role ?? 'user'
  };
}

// ! The backend reads a present password as a change request, so an untouched pair must not travel — and a present-but-empty one is rejected outright.
function updatePayloadFrom(values: CreateUserForm): UpdateUserForm {
  const payload: UpdateUserForm = {
    name: values.name,
    email: values.email,
    role: values.role
  };

  if (!values.password) return payload;

  return {
    ...payload,
    password: values.password,
    password_confirmation: values.password_confirmation
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

  if (!props.user) {
    createUser({ ...form.value });

    return;
  }

  updateUser({
    id: props.user.id,
    userData: updatePayloadFrom(form.value)
  });
}
</script>
