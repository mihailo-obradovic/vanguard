<template>
  <!-- <pre>{{ auth.user }}</pre> -->

  <div>
    <UHorizontalNavigation :links="links" />

    <button v-if="auth.isLoggedIn" @click="handleLogout">Logout</button>

    <slot />
  </div>
</template>

<script lang="ts" setup>
const auth = useAuthStore();

async function handleLogout() {
  await auth.logOut();
}

const links = [
  {
    label: 'Home',
    to: '/home',
    icon: 'i-mdi-home'
  },
  {
    label: 'Register',
    to: '/register'
  },
  {
    label: 'Login',
    to: '/login'
  },
  {
    label: 'Auth Only',
    to: '/auth-only'
  },
  {
    label: 'Guest Only',
    to: '/guest-only'
  }
];
</script>
