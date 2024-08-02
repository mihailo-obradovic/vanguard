<script lang="ts" setup>
const auth = useAuthStore();
</script>

<template>
  <pre>{{ auth.user }}</pre>
</template>

<style scoped lang="scss"></style>
