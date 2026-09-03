<template>
  <u-app>
    <NuxtLoadingIndicator />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <CookieConsentBanner />
  </u-app>
</template>

<script setup lang="ts">
useHead({
  title: 'Vanguard',

  link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }]
});

const route = useRoute();

const { isLoggedIn } = storeToRefs(useAuthStore());

watch(isLoggedIn, (loggedIn) => {
  const decision = determineAuthRedirect(
    route.path,
    loggedIn ? 'signed-in' : 'guest'
  );

  if (decision.shouldRedirect && decision.redirectTo) {
    navigateTo(decision.redirectTo, { replace: true });
  }
});
</script>
