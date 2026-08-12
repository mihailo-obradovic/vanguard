<template>
  <LoadingSpinner v-if="!user" :model-value="true" fill-height />

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

const { user } = storeToRefs(useAuthStore());

const route = useRoute();
const router = useRouter();

const { mutate: refreshUser } = useRefreshUser({
  onSuccess: () => {
    $toast('Your email has been verified.', 'success');
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
    $toast('Profile updated successfully', 'success');
    userCard.value?.resetForm();
  }
});

const profileErrors = useValidationErrors(updateProfileError);

function handleUpdate(form: ProfileForm) {
  updateProfile(form);
}
</script>
