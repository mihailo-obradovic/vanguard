<template>
  <UCard :ui="ui">ASD</UCard>
</template>

<script setup lang="ts">
const ui = /* ui */ {
  background: 'bg-red-700 dark:bg-slate-900'
};

const appConfig = useAppConfig();

console.log(appConfig);
</script>
