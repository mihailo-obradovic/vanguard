<template>
  <LoadingSpinner v-if="isLoading" v-model="isLoading" />

  <UserCard v-else :user="user" />
</template>

<script lang="ts" setup>
import UserCard from '@/components/users/UserCard.vue';

import useUserService from '@/services/useUserService';

definePageMeta({
  middleware: ['auth']
});

const { isLoading } = storeToRefs(useLoadingStore());
const { user: authUser } = storeToRefs(useAuthStore());

const { $startLoading, $stopLoading } = useLoadingStore();

const { fetchCurrentUser } = useUserService();

const user = ref(authUser.value);

onMounted(async () => {
  if (!user.value) {
    $startLoading();

    fetchCurrentUser()
      .then((response: any) => {
        user.value = response;
      })
      .finally($stopLoading);
  }
});
</script>
