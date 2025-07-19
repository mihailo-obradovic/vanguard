<template>
  <div>
    <button v-if="isLoggedIn" @click="handleLogout">Logout</button>

    <pre>{{ user }}</pre>

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
const { isLoggedIn, user } = storeToRefs(useAuthStore());

async function handleLogout() {
  await logOut();
}
</script>
