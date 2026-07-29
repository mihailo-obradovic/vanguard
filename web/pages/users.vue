<template>
  <LoadingSpinner
    v-if="isLoading['users']"
    v-model="isLoading['users']"
    fill-height
  />

  <UsersTable v-else :users="users" />
</template>

<script setup lang="ts">
import UsersTable from '@/components/users/UsersTable.vue';

import type { User } from '@/types/auth';
import { fetchUsers } from '@/services/user.api';

const { isLoading } = storeToRefs(useLoadingStore());
const { $startLoading, $stopLoading } = useLoadingStore();

const users = ref<User[]>([]);

async function loadUsers() {
  $startLoading('users');

  try {
    const response = await fetchUsers();

    users.value = response.data;
  } catch (error: unknown) {
    $toast(getErrorMessage(error), 'error');
  } finally {
    $stopLoading('users');
  }
}

onMounted(() => {
  loadUsers();
});
</script>
