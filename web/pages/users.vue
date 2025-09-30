<template>
  <LoadingSpinner
    v-if="isLoading['users']"
    v-model="isLoading['users']"
    fill-height
  />

  <UsersTable v-else :users="users" />
</template>

<script setup>
import UsersTable from '@/components/users/UsersTable.vue';

import { fetchUsers } from '@/services/user.api';

const { isLoading } = storeToRefs(useLoadingStore());
const { $startLoading, $stopLoading } = useLoadingStore();

const users = ref([]);

async function loadUsers() {
  $startLoading('users');

  try {
    const response = await fetchUsers();

    users.value = response.data;
  } catch (error) {
    error.value = err.message || 'Failed to load users';
    $toast(error.value, 'error');
  } finally {
    $stopLoading('users');
  }
}

onMounted(() => {
  loadUsers();
});
</script>
