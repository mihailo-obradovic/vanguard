<template>
  <v-snackbar
    :model-value="isMounted && !isDecided"
    :timeout="-1"
    location="bottom"
  >
    We use cookies to enhance your experience. You can accept or decline
    non-essential cookies.

    <template #actions>
      <v-btn variant="text" @click="decline">Decline</v-btn>

      <v-btn color="primary" variant="flat" @click="accept">Accept</v-btn>
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
const { isDecided, accept, decline } = useCookieConsent();

const isMounted = ref(false);

onMounted(() => {
  isMounted.value = true;
});
</script>
