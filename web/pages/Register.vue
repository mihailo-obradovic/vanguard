<template>
  <form @submit.prevent="handleRegister">
    <label for="name">
      Name
      <input id="name" v-model="form.name" type="text" />
    </label>

    <label for="email">
      Email
      <input id="email" v-model="form.email" type="email" />
    </label>

    <label for="password">
      Password
      <input id="password" v-model="form.password" type="password" />
    </label>

    <label for="password_confirmation">
      Password confirmation
      <input
        id="password_confirmation"
        v-model="form.password_confirmation"
        type="password"
      />
    </label>

    <button>Register</button>
  </form>
</template>

<script setup>
import useAuthService from '~/services/useAuthService';

definePageMeta({
  middleware: ['guest']
});

const { register } = useAuthService();

const form = ref({
  name: '',
  email: '',
  password: '',
  password_confirmation: ''
});

function handleRegister() {
  register(form.value)
    .then(() => {
      navigateTo('/home');
    })
    .catch((error) => {
      $toast(error, 'error');
    });
}
</script>
