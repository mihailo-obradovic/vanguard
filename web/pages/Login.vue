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
definePageMeta({
  middleware: ['guest']
});

const form = ref({
  email: 'test@example.com',
  password: 'gmaz'
});

const auth = useAuthStore();

function handleLogin() {
  auth.logIn(form.value);
}
</script>

<style scoped lang="scss"></style>
