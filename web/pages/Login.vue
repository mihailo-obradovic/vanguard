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

const auth = useAuthStore();

async function handleLogin() {
  const { error } = await auth.logIn(form.value);

  if (error.value) {
    console.log(error);
  }
}
</script>

<style scoped></style>
