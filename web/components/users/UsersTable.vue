<template>
  <GapContainer type="VSheet" elevation="1" class="rounded-lg">
    <v-table class="w-100">
      <thead>
        <tr>
          <th class="font-weight-bold">ID</th>
          <th class="font-weight-bold">Name</th>
          <th class="font-weight-bold">Email</th>
          <th class="font-weight-bold">Role</th>
          <th class="font-weight-bold text-right">Actions</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="user in users" :key="user.id">
          <td>{{ user.id }}</td>
          <td>{{ user.name }}</td>
          <td>{{ user.email }}</td>
          <td>
            <v-chip
              :color="user.role === 'admin' ? 'primary' : 'secondary'"
              variant="flat"
              size="small"
            >
              {{ user.role }}
            </v-chip>
          </td>
          <td class="text-right">
            <v-btn
              icon
              variant="text"
              color="primary"
              size="small"
              @click="emit('edit', user)"
            >
              <v-icon :icon="mdiPencil" />
            </v-btn>

            <v-btn
              v-if="user.id !== currentUserId"
              icon
              variant="text"
              color="error"
              size="small"
              :loading="deletingId === user.id"
              @click="emit('delete', user)"
            >
              <v-icon :icon="mdiDelete" />
            </v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>
  </GapContainer>
</template>

<script setup lang="ts">
import { mdiDelete, mdiPencil } from '@mdi/js';

import type { User } from '@/types/auth';

withDefaults(
  defineProps<{
    users: User[];
    deletingId?: number | null;
    currentUserId?: number | null;
  }>(),
  {
    deletingId: null,
    currentUserId: null
  }
);

const emit = defineEmits<{
  edit: [user: User];
  delete: [user: User];
}>();
</script>
