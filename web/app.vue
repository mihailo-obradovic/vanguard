<template>
  <NuxtLoadingIndicator />

  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>

  <!-- TODO: Cookie consent banner -->
</template>

<script setup>
import '@total-typescript/ts-reset';

useHead({
  title: 'Laravel Nuxt Template',

  meta: [
    { charset: 'utf-8' },
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1, shrink-to-fit=no'
    }
  ],

  link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }]
});
</script>
