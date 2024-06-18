<template>
  <form @submit.prevent="handleLogin">
    <label for="email">
      Email
      <input id="email" v-model="form.email" type="email" />
    </label>

    <label for="password">
      Password
      <input id="password" v-model="form.password" type="password" />
    </label>

    <button>Login</button>
  </form>
</template>

<script lang="ts" setup>
const form = ref({
  email: 'test@example.com',
  password: 'gmaz'
});

const auth = useAuthStore();

async function handleLogin() {
  const { error } = await auth.logIn(form.value);

  if (error.value) {
    console.log(error);
  }
}
</script>

<style scoped></style>
