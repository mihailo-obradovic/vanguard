<template>
  <LoadingSpinner v-if="isLoading" v-model="isLoading" />

  <UsersTable v-else :users="users" />
</template>

<script setup>
import UsersTable from '~/components/users/UsersTable.vue';

import useUserService from '~/services/useUserService';

definePageMeta({
  middleware: ['auth']
});

const { isLoading } = storeToRefs(useLoadingStore());
const { $startLoading, $stopLoading } = useLoadingStore();

const { fetchUsers } = useUserService();

const users = ref([]);

function loadUsers() {
  $startLoading();

  fetchUsers()
    .then((response) => {
      users.value = response;
    })
    .finally($stopLoading);
}

onMounted(() => {
  loadUsers();
});
</script>
