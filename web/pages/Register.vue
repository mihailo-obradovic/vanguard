<template>
  <form @submit.prevent="handleRegister">
    <label for="name">
      Name
      <input id="name" type="text" v-model="form.name" />
    </label>

    <label for="email">
      Email
      <input id="email" type="email" v-model="form.email" />
    </label>

    <label for="password">
      Password
      <input id="password" type="password" v-model="form.password" />
    </label>

    <label for="password_confirmation">
      Password confirmation
      <input
        id="password_confirmation"
        type="password"
        v-model="form.password_confirmation"
      />
    </label>

    <button>Register</button>
  </form>
</template>

<script lang="ts" setup>
const form = ref({
  name: '',
  email: '',
  password: '',
  password_confirmation: ''
});

const auth = useAuthStore();

async function handleRegister() {
  const { error } = await auth.register(form.value);

  if (error.value) {
    console.log(error);

    return;
  }

  navigateTo('/home');
}
</script>
