<template>
  <v-bottom-sheet
    :model-value="isMounted && !isDecided"
    persistent
    no-click-animation
  >
    <v-card
      role="region"
      :aria-label="$t('common.cookieConsent.label')"
      class="pa-4"
    >
      <div class="d-flex flex-column flex-sm-row align-sm-center ga-4">
        <p class="text-body-2 grow">
          {{ $t('common.cookieConsent.message') }}
        </p>

        <div class="d-flex justify-end ga-2 shrink-0">
          <v-btn variant="outlined" @click="decline">
            {{ $t('common.cookieConsent.decline') }}
          </v-btn>

          <v-btn color="primary" variant="flat" @click="accept">
            {{ $t('common.cookieConsent.accept') }}
          </v-btn>
        </div>
      </div>
    </v-card>
  </v-bottom-sheet>
</template>

<script setup lang="ts">
const { isDecided, accept, decline } = useCookieConsent();

const isMounted = ref(false);

onMounted(() => {
  isMounted.value = true;
});
</script>
