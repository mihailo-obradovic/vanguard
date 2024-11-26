<template>
  <LoadingSpinner
    v-if="isLoading"
    v-model="isLoading['current-user']"
    fill-height
  />

  <UserCard v-else ref="userCard" :user="user" @update="handleUpdate" />
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

const { fetchCurrentUser, updateUser } = useUserService();

const user = ref(authUser.value);

const userCard = ref(null);

onMounted(async () => {
  if (!user.value) {
    $startLoading('current-user');

    fetchCurrentUser()
      .then((response: any) => {
        user.value = response;
      })
      .finally(() => $stopLoading('current-user'));
  }
});

function handleUpdate(form: any) {
  $startLoading('dialog');

  updateUser(user.value.id, form)
    .then((response: any) => {
      user.value = authUser.value = response;

      userCard.value?.resetForm();
    })
    .finally(() => $stopLoading('dialog'));
}
</script>
