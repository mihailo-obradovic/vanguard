<template>
  <LoadingSpinner
    v-if="isLoading['current-user']"
    v-model="isLoading['current-user']"
    fill-height
  />

  <UserCard v-else ref="userCard" @update="handleUpdate" />
</template>

<script setup lang="ts">
import UserCard from '@/components/users/UserCard.vue';

import { fetchCurrentUser, updateProfile } from '@/services/auth.api';

const { isLoading } = storeToRefs(useLoadingStore());
const { setUser } = useAuthStore();

const { $startLoading, $stopLoading } = useLoadingStore();

const route = useRoute();
const router = useRouter();

onMounted(async () => {
  if (route.query.verified === '1') {
    await fetchCurrentUser();
    $toast('Your email has been verified.', 'success');
    router.replace({ query: {} });
  }
});

const userCard = ref(null);

function handleUpdate(form: any) {
  $startLoading('dialog');

  updateProfile(form)
    .then((updatedUser) => {
      setUser(updatedUser);

      userCard.value?.resetForm();
    })
    .catch((error: unknown) => {
      $toast(getErrorMessage(error), 'error');
    })
    .finally(() => $stopLoading('dialog'));
}
</script>
