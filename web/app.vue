<template>
  <!-- * Default: a green-to-blue gradient hardcoded in Nuxt, off this palette entirely and visible on every route change. Tokens rather than literal colours, so the bar follows the colour mode the way everything else does. -->
  <NuxtLoadingIndicator
    color="var(--primary)"
    error-color="var(--destructive)"
  />

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
