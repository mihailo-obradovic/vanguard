<template>
  <form @submit.prevent="handleLogin">
    <label for="email">
      Email
      <input id="email" type="email" v-model="form.email" />
    </label>

    <label for="password">
      Password
      <input id="password" type="password" v-model="form.password" />
    </label>

    <button>Login</button>
  </form>
</template>

<script lang="ts" setup>
const form = ref({
  email: 'test@example.com',
  password: 'gmaz'
});

async function handleLogin() {
  await useApiFetch('/sanctum/csrf-cookie');

  await useApiFetch('/login', {
    method: 'POST',
    body: form.value
  });

  const { data } = await useApiFetch('/api/user');

  console.log(data);
}
</script>

<style scoped></style>
