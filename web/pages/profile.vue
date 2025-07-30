<template>
  <LoadingSpinner
    v-if="isLoading['current-user']"
    v-model="isLoading['current-user']"
    fill-height
  />

  <UserCard v-else ref="userCard" @update="handleUpdate" />
</template>

<script lang="ts" setup>
import UserCard from '@/components/users/UserCard.vue';

import { updateUser } from '@/services/user.api';

const { isLoading } = storeToRefs(useLoadingStore());
const { user } = storeToRefs(useAuthStore());
const { setUser } = useAuthStore();

const { $startLoading, $stopLoading } = useLoadingStore();

const userCard = ref(null);

function handleUpdate(form: any) {
  $startLoading('dialog');

  updateUser(user.value.id, form)
    .then((response: any) => {
      setUser(response);

      userCard.value?.resetForm();
    })
    .finally(() => $stopLoading('dialog'));
}
</script>
