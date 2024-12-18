<template>
  <div>
    <button v-if="isLoggedIn" @click="handleLogout">Logout</button>

    <pre>{{ user }}</pre>

    <ul>
      <li>
        <NuxtLink to="/">Home</NuxtLink>
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
import useAuthService from '@/services/useAuthService';

const { isLoggedIn, user } = storeToRefs(useAuthStore());

const { fetchUser, logOut } = useAuthService();

async function loadEssentialData() {
  if (!isLoggedIn.value) {
    navigateTo('/login');

    return;
  }

  await fetchUser();
}

async function handleLogout() {
  await logOut();
}

await loadEssentialData();
</script>
