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

function loadUsers() {
  $startLoading('users');

  fetchUsers()
    .then((response) => {
      users.value = response;
    })
    .finally(() => $stopLoading('users'));
}

onMounted(() => {
  loadUsers();
});
</script>
