<template>
  <NuxtLoadingIndicator />

  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>

  <CookieConsentBanner />

  <Toaster />
</template>

<script setup lang="ts">
import 'vue-sonner/style.css';

import { Toaster } from '@/components/ui/sonner';

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
