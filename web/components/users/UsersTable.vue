<template>
  <GapContainer type="VSheet" elevation="1" class="rounded-lg">
    <v-table class="w-100">
      <thead>
        <tr>
          <th class="font-weight-bold">ID</th>
          <th class="font-weight-bold">Name</th>
          <th class="font-weight-bold">Email</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="user in users" :key="user.id">
          <td>{{ user.id }}</td>
          <td>{{ user.name }}</td>
          <td>{{ user.email }}</td>
        </tr>
      </tbody>
    </v-table>
  </GapContainer>
</template>

<script setup>
defineProps({
  users: {
    type: Array,
    required: true
  }
});
</script>
