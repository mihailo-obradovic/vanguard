<template>
  <!-- * Only reachable when session priming failed to produce a user — a skeleton in UserCard's footprint, not a bare spinner, so the page keeps its shape. -->
  <v-row v-if="!user" no-gutters>
    <v-col cols="12" md="6">
      <v-sheet class="pa-4 rounded-lg" elevation="1">
        <v-skeleton-loader type="heading, text@2, chip" />
      </v-sheet>
    </v-col>
  </v-row>

  <UserCard
    v-else
    ref="userCard"
    :loading="isUpdatingProfile"
    :server-errors="profileErrors"
    @update="handleUpdate"
  />
</template>

<script setup lang="ts">
import UserCard from '@/components/users/UserCard.vue';

import {
  useRefreshUser,
  useUpdateProfile
} from '@/services/queries/useAuthQueries';

import type { ProfileForm } from '@/types/user';

const { t } = useI18n();

const { user } = storeToRefs(useAuthStore());

const route = useRoute();
const router = useRouter();

const { mutate: refreshUser } = useRefreshUser({
  onSuccess: () => {
    $toast(t('profile.toasts.emailVerified'), 'success');
    router.replace({ query: {} });
  }
});

onMounted(() => {
  if (route.query.verified === '1') {
    refreshUser();
  }
});

const userCard = useTemplateRef<InstanceType<typeof UserCard>>('userCard');

const {
  mutate: updateProfile,
  isLoading: isUpdatingProfile,
  error: updateProfileError
} = useUpdateProfile({
  errorHandling: { hideValidationToast: true },
  onSuccess: () => {
    $toast(t('profile.toasts.updated'), 'success');
    userCard.value?.resetForm();
  }
});

const profileErrors = useValidationErrors(updateProfileError);

function handleUpdate(form: ProfileForm) {
  updateProfile(form);
}
</script>
