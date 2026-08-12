<template>
  <v-bottom-sheet
    :model-value="isMounted && !isDecided"
    persistent
    no-click-animation
  >
    <v-card role="region" aria-label="Cookie consent" class="pa-4">
      <div class="d-flex flex-column flex-sm-row align-sm-center ga-4">
        <p class="text-body-2 flex-grow-1">
          We use cookies to enhance your experience. You can accept or decline
          non-essential cookies.
        </p>

        <div class="d-flex justify-end ga-2 flex-shrink-0">
          <v-btn variant="outlined" @click="decline">Decline</v-btn>

          <v-btn color="primary" variant="flat" @click="accept">Accept</v-btn>
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
