<template>
  <NuxtLoadingIndicator />

  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>

  <!-- TODO: Cookie consent banner -->
</template>

<script setup lang="ts">
useHead({
  title: 'Vanguard',

  meta: [
    { charset: 'utf-8' },
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1, shrink-to-fit=no'
    }
  ],

  link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }]
});

const route = useRoute();

const { isLoggedIn } = storeToRefs(useAuthStore());

watch(isLoggedIn, () => {
  const decision = determineAuthRedirect(route.path, route.query);

  if (decision.shouldRedirect && decision.redirectTo) {
    navigateTo(decision.redirectTo, { replace: true });
  }
});
</script>
