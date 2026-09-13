<template>
  <NuxtLoadingIndicator />

  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>

  <CookieConsentBanner />

  <!-- * Mounted once, here; `utils/toast.ts` is the seam every call site goes through. The four variables point vue-sonner's own palette at this theme's tokens, so a toast reads like the rest of the UI. -->
  <toaster
    :style="{
      '--normal-bg': 'var(--color-surface)',
      '--normal-text': 'var(--color-text-strong)',
      '--normal-border': 'var(--color-border)',
      '--border-radius': 'var(--radius)'
    }"
  />
</template>

<script setup lang="ts">
import 'vue-sonner/style.css';

import { Toaster } from 'vue-sonner';

useHead({
  title: 'Vanguard',

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
