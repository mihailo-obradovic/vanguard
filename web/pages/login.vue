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
import { logIn } from '@/services/auth.api';

const form = ref({
  email: 'test@example.com',
  password: 'gmaz1234'
});

function handleLogin() {
  logIn(form.value)
    .then(() => {
      navigateTo('/home');
    })
    .catch((error: Error) => {
      $toast(error.message, 'error');
    });
}
</script>

<style scoped lang="scss"></style>
