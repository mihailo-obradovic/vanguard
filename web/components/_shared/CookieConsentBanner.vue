<template>
  <Transition
    enter-active-class="transition duration-200"
    leave-active-class="transition duration-200"
    enter-from-class="translate-y-full opacity-0"
    leave-to-class="translate-y-full opacity-0"
  >
    <div
      v-if="isMounted && !isDecided"
      class="bg-default border-default fixed inset-x-0 bottom-0 z-50 border-t shadow-lg"
      role="region"
      :aria-label="$t('common.cookieConsent.label')"
    >
      <div
        class="mx-auto flex max-w-6xl flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <p class="text-muted text-sm">
          {{ $t('common.cookieConsent.message') }}
        </p>

        <div class="flex shrink-0 justify-end gap-2">
          <u-button color="neutral" variant="outline" @click="decline">
            {{ $t('common.cookieConsent.decline') }}
          </u-button>

          <u-button @click="accept">
            {{ $t('common.cookieConsent.accept') }}
          </u-button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const { isDecided, accept, decline } = useCookieConsent();

const isMounted = ref(false);

onMounted(() => {
  isMounted.value = true;
});
</script>
