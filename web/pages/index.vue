<template>
  <div />
</template>

<script setup lang="ts">
const route = useRoute();

if (route.path !== '/home') {
  await navigateTo('/home');
}
</script>
