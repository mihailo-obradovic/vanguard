<template>
  <!-- * `min-h-0` hands the overflow to the fields below rather than growing the card past the
       page — main.css pins the page to overflow-y: hidden, so an unbounded card is unreachable. -->
  <Card
    class="mx-auto flex max-h-full min-h-0 w-full max-w-[800px] flex-col gap-0 py-0"
    @keydown.enter="confirmFromEnter"
  >
    <CardHeader
      class="flex shrink-0 flex-row items-center justify-between gap-4 px-6 py-4"
    >
      <CardTitle as="h2" class="text-primary text-2xl font-semibold">
        {{ $t('profile.title') }}
      </CardTitle>

      <div class="flex gap-2">
        <!-- * Cancel discards the edit rather than destroying anything, so it is the quiet one; save is the primary action and carries the weight. -->
        <Button
          v-if="editMode"
          variant="outline"
          size="icon-sm"
          :aria-label="$t('common.actions.cancel')"
          @click="resetForm"
        >
          <X class="size-4" />
        </Button>

        <Button
          v-if="!editMode"
          variant="outline"
          size="icon-sm"
          :aria-label="$t('common.actions.edit')"
          @click="startEditing"
        >
          <Pencil class="size-4" />
        </Button>

        <Button
          v-else
          size="icon-sm"
          :aria-label="$t('common.actions.save')"
          :disabled="loading"
          @click="handleSubmit"
        >
          <Loader2 v-if="loading" class="size-4 animate-spin" />
          <Check v-else class="size-4" />
        </Button>
      </div>
    </CardHeader>

    <UIScrollArea class="min-h-0 px-6 pt-2 pb-6">
      <FieldGroup class="gap-4">
        <Field :data-invalid="name.invalid">
          <FieldLabel :for="name.id">{{ $t('common.fields.name') }}</FieldLabel>

          <Input
            v-model="form.name"
            type="text"
            :readonly="!editMode"
            v-bind="name.control"
          />

          <FieldError :id="name.errorId" :errors="name.errors" />
        </Field>

        <Field :data-invalid="email.invalid">
          <FieldLabel :for="email.id">{{
            $t('common.fields.email')
          }}</FieldLabel>

          <Input
            v-model="form.email"
            type="email"
            :readonly="!editMode"
            v-bind="email.control"
          />

          <FieldError :id="email.errorId" :errors="email.errors" />
        </Field>

        <div class="flex items-center gap-3">
          <VerificationBadge :verified="!!user?.email_verified_at">
            {{
              user?.email_verified_at
                ? $t('profile.info.verified')
                : $t('profile.info.notVerified')
            }}
          </VerificationBadge>

          <!-- * Stays in the row once the address is verified, reserved rather than removed: it is
               what gives this row its height, and dropping it pulls the fields below it up. `inert`
               keeps a control nobody can see out of the tab order and the accessibility tree. -->
          <Button
            variant="outline"
            size="sm"
            :class="user?.email_verified_at && 'invisible'"
            :inert="Boolean(user?.email_verified_at)"
            :disabled="isResending"
            @click="resendVerification()"
          >
            <UIReservedLabel
              :variants="{
                idle: $t('profile.info.resend'),
                pending: $t('profile.info.resending')
              }"
              :active="isResending ? 'pending' : 'idle'"
            />
          </Button>
        </div>

        <template v-if="editMode">
          <Field :data-invalid="currentPassword.invalid">
            <FieldLabel :for="currentPassword.id">{{
              $t('profile.form.currentPassword')
            }}</FieldLabel>

            <Input
              v-model="form.current_password"
              type="password"
              v-bind="currentPassword.control"
            />

            <FieldError
              :id="currentPassword.errorId"
              :errors="currentPassword.errors"
            />
          </Field>

          <Field :data-invalid="newPassword.invalid">
            <FieldLabel :for="newPassword.id">{{
              $t('profile.form.newPassword')
            }}</FieldLabel>

            <Input
              v-model="form.password"
              type="password"
              v-bind="newPassword.control"
            />

            <FieldError
              :id="newPassword.errorId"
              :errors="newPassword.errors"
            />
          </Field>

          <Field :data-invalid="confirmPassword.invalid">
            <FieldLabel :for="confirmPassword.id">{{
              $t('profile.form.confirmNewPassword')
            }}</FieldLabel>

            <Input
              v-model="form.password_confirmation"
              type="password"
              v-bind="confirmPassword.control"
            />

            <FieldError
              :id="confirmPassword.errorId"
              :errors="confirmPassword.errors"
            />
          </Field>
        </template>
      </FieldGroup>
    </UIScrollArea>
  </Card>
</template>

<script setup lang="ts">
import { requiredIf } from '@regle/rules';
import { Check, Loader2, Pencil, X } from '@lucide/vue';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';

import {
  useResendEmailVerification,
  useUpdateProfile
} from '@/services/queries/useAuthQueries';

import type { ProfileForm } from '@/types/user';

const { t } = useI18n();

const { user } = storeToRefs(useAuthStore());

const editMode = ref(false);

const { mutate: resendVerification, isLoading: isResending } =
  useResendEmailVerification({
    onSuccess: () => {
      $toast(t('profile.toasts.verificationSent'), 'success');
    }
  });

const initialForm = computed(() => ({
  name: user.value?.name || '',
  email: user.value?.email || '',
  current_password: '',
  password: '',
  password_confirmation: ''
}));

const form = ref({ ...initialForm.value });

// * The card owns the whole edit: submitting it, the 422s that come back onto its own fields, and leaving edit mode once the save lands. Nothing above it has to know the order those happen in.
const {
  mutate: updateProfile,
  isLoading: loading,
  error: updateProfileError
} = useUpdateProfile({
  // * A validation failure this form could have caught belongs on its field, not in a toast.
  errorHandling: { suppressToasts: 'validation' },
  onSuccess: () => {
    $toast(t('profile.toasts.updated'), 'success');

    resetForm();
  }
});

const externalErrors = useExternalErrors(
  useValidationErrors(updateProfileError)
);

// * Mirrors ProfileUpdateRequest: the current password is only needed when setting a new one.
const { r$ } = useRegle(
  form,
  () => ({
    ...nameRules(),
    // * The signed-in user already owns their own address, so the check has to ignore them.
    ...accountEmailRules(() => user.value?.id),
    current_password: labeledRules('validation.fieldNames.currentPassword', {
      requiredIf: requiredIf(() => !!form.value.password)
    }),
    ...newPasswordRules(() => form.value.password, 'change')
  }),
  { externalErrors }
);

const name = useFieldAria(() => r$.name.$errors);
const email = useFieldAria(() => r$.email.$errors);
const currentPassword = useFieldAria(() => r$.current_password.$errors);
const newPassword = useFieldAria(() => r$.password.$errors);
const confirmPassword = useFieldAria(() => r$.password_confirmation.$errors);

function startEditing() {
  editMode.value = true;
}

function resetForm() {
  editMode.value = false;

  r$.$reset({ toState: { ...initialForm.value }, clearExternalErrors: true });
}

async function handleSubmit() {
  const { valid } = await r$.$validate();

  if (!valid) {
    return;
  }

  const updateData: ProfileForm = {
    name: form.value.name,
    email: form.value.email
  };

  // * Only include the password pair — and the current-password challenge that authorizes it — when a new password is being set; a present-but-empty current_password is rejected by the backend.
  if (form.value.password) {
    updateData.current_password = form.value.current_password;
    updateData.password = form.value.password;
    updateData.password_confirmation = form.value.password_confirmation;
  }

  updateProfile(updateData);
}

const confirmFromEnter = useConfirmOnEnter(handleSubmit, () => editMode.value);

// * Window-level so Esc cancels editing even when focus has left the card
onKeyStroke('Escape', () => {
  if (editMode.value) {
    resetForm();
  }
});
</script>
