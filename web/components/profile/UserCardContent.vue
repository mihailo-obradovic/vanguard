<template>
  <!-- * The edit, save and cancel controls live in the header, so the body is what scrolls — a card that scrolled whole would carry them off the screen. -->
  <u-card
    ref="card"
    :ui="{
      root: 'flex flex-col',
      header: 'shrink-0',
      body: bodyClasses
    }"
  >
    <template #header>
      <div class="flex items-center justify-between gap-4">
        <h1 class="text-xl font-semibold">{{ $t('profile.title') }}</h1>

        <div class="flex gap-1">
          <template v-if="editMode">
            <u-button
              color="error"
              variant="ghost"
              icon="i-lucide-x"
              :aria-label="$t('common.actions.cancel')"
              @click="resetForm"
            />

            <u-button
              type="submit"
              form="profile-form"
              color="success"
              variant="ghost"
              icon="i-lucide-check"
              :aria-label="
                isSaving
                  ? $t('common.actions.saving')
                  : $t('common.actions.save')
              "
              :loading="isSaving"
              :disabled="r$.$invalid"
            />
          </template>

          <u-button
            v-else
            variant="ghost"
            icon="i-lucide-pencil"
            :aria-label="$t('common.actions.edit')"
            @click="editMode = true"
          />
        </div>
      </div>
    </template>

    <form id="profile-form" class="space-y-4" @submit.prevent="handleSubmit">
      <u-form-field
        :label="$t('common.fields.name')"
        :error="r$.name.$errors[0]"
      >
        <u-input v-model="form.name" :readonly="!editMode" class="w-full" />
      </u-form-field>

      <u-form-field
        :label="$t('common.fields.email')"
        :error="r$.email.$errors[0]"
      >
        <u-input
          v-model="form.email"
          type="email"
          :readonly="!editMode"
          class="w-full"
        />
      </u-form-field>

      <!-- * The password fields arrive and leave together, so the card grows and shrinks rather
           than snapping. The height is animated through `grid-template-rows: 0fr → 1fr` — the one
           way to transition to a content height CSS will not interpolate directly — which needs
           the grid parent and the `min-h-0` child below to work; neither is decoration.
           `motion-safe:` is the reduced-motion guard (§14.4), matching the exit animation in
           `config/nuxt-ui/form-field.ts` in both duration and easing. -->
      <Transition
        enter-active-class="motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out"
        leave-active-class="motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out"
        enter-from-class="grid-rows-[0fr]! opacity-0"
        leave-to-class="grid-rows-[0fr]! opacity-0"
      >
        <div v-if="editMode" class="grid grid-rows-[1fr]">
          <div class="min-h-0 space-y-4 overflow-hidden">
            <u-form-field
              :label="$t('common.fields.currentPassword')"
              :error="r$.current_password.$errors[0]"
            >
              <u-input
                v-model="form.current_password"
                type="password"
                autocomplete="current-password"
                class="w-full"
              />
            </u-form-field>

            <u-form-field
              :label="$t('profile.form.newPassword')"
              :error="r$.password.$errors[0]"
            >
              <u-input
                v-model="form.password"
                type="password"
                autocomplete="new-password"
                class="w-full"
              />
            </u-form-field>

            <u-form-field
              :label="$t('profile.form.confirmNewPassword')"
              :error="r$.password_confirmation.$errors[0]"
            >
              <u-input
                v-model="form.password_confirmation"
                type="password"
                autocomplete="new-password"
                class="w-full"
              />
            </u-form-field>
          </div>
        </div>
      </Transition>
    </form>

    <dl class="mt-6 grid gap-4 sm:grid-cols-2">
      <div>
        <dt class="text-sm text-muted">{{ $t('common.fields.role') }}</dt>

        <dd class="mt-1"><RoleBadge :role="user.role" large /></dd>
      </div>

      <div>
        <dt class="text-sm text-muted">
          {{ $t('profile.info.emailVerified') }}
        </dt>

        <dd class="mt-1 flex items-center gap-2">
          <VerificationBadge :verified="!!user.email_verified_at" large>
            <ReservedLabel
              :variants="{
                verified: $t('profile.info.verified'),
                unverified: $t('profile.info.notVerified')
              }"
              :active="user.email_verified_at ? 'verified' : 'unverified'"
            />
          </VerificationBadge>

          <!-- * Stays in the row once the address is verified, reserved rather than removed: it is what gives this row its height, and dropping it pulls the rest of the list up. `inert` keeps a control nobody can see out of the tab order and the accessibility tree. -->
          <u-button
            variant="link"
            size="sm"
            :class="user.email_verified_at && 'invisible'"
            :inert="Boolean(user.email_verified_at)"
            :loading="isResending"
            @click="resendVerification()"
          >
            <ReservedLabel
              :variants="{
                idle: $t('profile.info.resend'),
                pending: $t('profile.info.resending')
              }"
              :active="isResending ? 'pending' : 'idle'"
            />
          </u-button>
        </dd>
      </div>

      <div>
        <dt class="text-sm text-muted">{{ $t('profile.info.memberSince') }}</dt>

        <dd class="mt-1">{{ formatDate(user.created_at) }}</dd>
      </div>

      <div>
        <dt class="text-sm text-muted">{{ $t('profile.info.lastUpdated') }}</dt>

        <dd class="mt-1">{{ formatDate(user.updated_at) }}</dd>
      </div>
    </dl>
  </u-card>
</template>

<script setup lang="ts">
import { requiredIf } from '@regle/rules';

import {
  useResendEmailVerification,
  useUpdateProfile
} from '@/services/queries/useAuthQueries';

import type { User } from '@/types/auth';
import type { ProfileForm } from '@/types/user';

const props = defineProps<{ user: User }>();

const card = useTemplateRef<{ $el: HTMLElement }>('card');

const edges = ref({ top: false, bottom: false, left: false, right: false });

// * Nuxt UI takes the body's classes as a string, so the edge state is folded into it rather than bound separately.
const bodyClasses = computed(() =>
  [
    'min-h-0 flex-1 overflow-y-auto card-scroll',
    edges.value.top && 'edge-top',
    edges.value.bottom && 'edge-bottom'
  ]
    .filter(Boolean)
    .join(' ')
);

const scroller = computed(
  () => card.value?.$el?.querySelector<HTMLElement>('.card-scroll') ?? undefined
);

// ! Per edge, never one boolean for the region: at the top a top border claims content above that is not there, and at the end a bottom border claims more below. The arithmetic and its tolerance live in `utils/scrollEdges.ts`.
function measure() {
  const el = scroller.value;

  if (el) {
    edges.value = scrollEdges(el);
  }
}

// * The container, the content inside it, and scroll — missing any one leaves a border stale.
useResizeObserver(
  computed(() =>
    [scroller.value, scroller.value?.firstElementChild].filter(
      (el): el is HTMLElement => el instanceof HTMLElement
    )
  ),
  measure
);
useEventListener(scroller, 'scroll', measure, { passive: true });

onMounted(measure);

const { t } = useI18n();

const editMode = ref(false);

const form = ref(formFor(props.user));

const { mutate: resendVerification, isLoading: isResending } =
  useResendEmailVerification({
    onSuccess: () => $toast(t('profile.toasts.verificationSent'), 'success')
  });

// * The card owns the whole edit: submitting it, the 422s that come back onto its own fields, and leaving edit mode once the save lands. The page above it only supplies the user.
const {
  mutate: updateProfile,
  isLoading: isSaving,
  error: updateProfileError
} = useUpdateProfile({
  errorHandling: { suppressToasts: 'validation' },
  onSuccess: () => {
    $toast(t('profile.toasts.updated'), 'success');

    resetForm();
  }
});

const { r$ } = useRegle(
  form,
  {
    ...nameRules(),
    // * The signed-in user already owns their own address, so the check has to ignore them.
    ...accountEmailRules(() => props.user.id),
    current_password: labeledRules('validation.fieldNames.currentPassword', {
      requiredIf: requiredIf(() => !!form.value.password)
    }),
    ...newPasswordRules(() => form.value.password, 'change')
  },
  { externalErrors: useExternalErrors(useValidationErrors(updateProfileError)) }
);

function formFor(user: User) {
  return {
    name: user.name,
    email: user.email,
    current_password: '',
    password: '',
    password_confirmation: ''
  };
}

function resetForm() {
  editMode.value = false;

  r$.$reset({ toState: formFor(props.user), clearExternalErrors: true });
}

async function handleSubmit() {
  const { valid } = await r$.$validate();

  if (!valid) {
    return;
  }

  const payload: ProfileForm = {
    name: form.value.name,
    email: form.value.email
  };

  // ! Only the password pair — and the current-password challenge that authorizes it — travel when a new password is being set; a present-but-empty current_password is rejected by the backend.
  if (form.value.password) {
    payload.current_password = form.value.current_password;
    payload.password = form.value.password;
    payload.password_confirmation = form.value.password_confirmation;
  }

  updateProfile(payload);
}

// * Window-level so Esc cancels editing even when focus has left the card.
onKeyStroke('Escape', () => {
  if (editMode.value) {
    resetForm();
  }
});
</script>

<style scoped>
:deep(.card-scroll) {
  border-top: 1px solid transparent;
  border-bottom: 1px solid transparent;
}

:deep(.card-scroll.edge-top) {
  border-top-color: var(--ui-scroll-edge);
}

:deep(.card-scroll.edge-bottom) {
  border-bottom-color: var(--ui-scroll-edge);
}
</style>
