<script lang="ts" setup></script>

<template>
  <div>
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

      <li>
        <NuxtLink to="/logout">Logout</NuxtLink>
      </li>
    </ul>

    <slot />
  </div>
</template>

<style scoped></style>
