<template>
  <LoadingSpinner v-if="!user" :model-value="true" fill-height />

  <UserCard
    v-else
    ref="userCard"
    :loading="isUpdatingProfile"
    @update="handleUpdate"
  />
</template>

<script setup lang="ts">
import UserCard from '@/components/users/UserCard.vue';

import { fetchCurrentUser } from '@/services/auth.api';
import { useUpdateProfile } from '@/services/queries/useAuthQueries';

import type { ProfileForm } from '@/types/user';

const { user } = storeToRefs(useAuthStore());
const { setUser } = useAuthStore();

const route = useRoute();
const router = useRouter();

onMounted(async () => {
  if (route.query.verified === '1') {
    setUser(await fetchCurrentUser());
    $toast('Your email has been verified.', 'success');
    router.replace({ query: {} });
  }
});

const userCard = useTemplateRef<InstanceType<typeof UserCard>>('userCard');

const { mutate: updateProfile, isLoading: isUpdatingProfile } =
  useUpdateProfile({
    onSuccess: () => {
      userCard.value?.resetForm();
    }
  });

function handleUpdate(form: ProfileForm) {
  updateProfile(form);
}
</script>
