<template>
  <LoadingSpinner v-if="isLoading" :model-value="true" fill-height />

  <UsersTable v-else :users="users" />
</template>

<script setup lang="ts">
import UsersTable from '@/components/users/UsersTable.vue';

import { useFetchUsers } from '@/services/queries/useUserQueries';

const { data, isLoading } = useFetchUsers();

const users = computed(() => data.value?.data ?? []);
</script>
