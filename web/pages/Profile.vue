<template>
  <pre>{{ auth.user }}</pre>
</template>

<script lang="ts" setup>
const auth = useAuthStore();

definePageMeta({
  middleware: ['auth']
});
</script>
