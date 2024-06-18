<template>
  <div>
    <button v-if="auth.isLoggedIn" @click="handleLogout">Logout</button>

    <pre>{{ auth.user }}</pre>

    <ul>
      <li>
        <NuxtLink to="/home">Home</NuxtLink>
      </li>

      <li>
        <NuxtLink to="/register">Register</NuxtLink>
      </li>

      <li>
        <NuxtLink to="/login">Login</NuxtLink>
      </li>

      <li>
        <NuxtLink to="/auth-only">Auth Only</NuxtLink>
      </li>

      <li>
        <NuxtLink to="/guest-only">Guest Only</NuxtLink>
      </li>
    </ul>

    <slot />
  </div>
</template>

<script lang="ts" setup>
const auth = useAuthStore();

async function handleLogout() {
  await auth.logOut();
}
</script>
