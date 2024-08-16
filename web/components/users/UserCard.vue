<template>
  <div>{{ user.name }}</div>
</template>

<script setup>
defineProps({
  user: {
    type: Object,
    default: null
  }
});
</script>
