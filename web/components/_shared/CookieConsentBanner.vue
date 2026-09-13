<template>
  <!-- * Slides up from the bottom edge on first mount and back down once decided — the enter and leave states are the same offset, so one pair of classes describes both. -->
  <Transition
    enter-active-class="transition duration-250 ease-out"
    leave-active-class="transition duration-250 ease-in"
    enter-from-class="translate-y-full opacity-0"
    leave-to-class="translate-y-full opacity-0"
  >
    <div
      v-if="isMounted && !isDecided"
      class="bg-card fixed inset-x-0 bottom-0 z-[1000] border-t shadow-[0_-4px_6px_rgb(0_0_0/0.1)]"
      role="region"
      :aria-label="$t('common.cookieConsent.label')"
    >
      <div
        class="mx-auto flex max-w-[1200px] items-center justify-between gap-4 p-4 max-sm:flex-col max-sm:items-stretch"
      >
        <p class="text-sm">
          {{ $t('common.cookieConsent.message') }}
        </p>

        <!-- * Decline carries the same weight of control as Accept, one step quieter — a banner that makes refusing harder than agreeing is the dark pattern this component exists to avoid. -->
        <div class="flex shrink-0 items-center gap-2 max-sm:justify-end">
          <Button variant="outline" @click="decline">
            {{ $t('common.cookieConsent.decline') }}
          </Button>

          <Button @click="accept">
            {{ $t('common.cookieConsent.accept') }}
          </Button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button';

const { isDecided, accept, decline } = useCookieConsent();

const isMounted = ref(false);

onMounted(() => {
  isMounted.value = true;
});
</script>
