<template>
  <NuxtLoadingIndicator />

  <NuxtLayout name="empty">
    <v-card color="background" width="480" class="pa-2">
      <v-card-title class="text-center text-wrap">
        {{ error.statusCode }} — {{ title }}
      </v-card-title>

      <v-card-text>
        <GapContainer column>
          <p class="text-center">{{ message }}</p>

          <v-row no-gutters class="d-flex ga-4">
            <v-col>
              <v-btn
                block
                variant="outlined"
                :prepend-icon="mdiRefresh"
                @click="refreshPage"
              >
                Refresh
              </v-btn>
            </v-col>

            <v-col>
              <v-btn
                block
                color="primary"
                variant="flat"
                :prepend-icon="mdiHome"
                @click="goHome"
              >
                Go Home
              </v-btn>
            </v-col>
          </v-row>

          <v-expansion-panels>
            <v-expansion-panel bg-color="background" title="Technical details">
              <v-expansion-panel-text>
                <pre class="details">{{ formattedError }}</pre>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </GapContainer>
      </v-card-text>
    </v-card>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { mdiHome, mdiRefresh } from '@mdi/js';

import type { NuxtError } from '#app';

const props = defineProps<{ error: NuxtError }>();

const title = computed(() =>
  props.error.statusCode === 404 ? 'Page Not Found' : 'Something Went Wrong'
);

const message = computed(() => {
  if (props.error.statusCode === 404) {
    return 'The page you are looking for does not exist or has been moved.';
  }

  // * Nuxt defaults `message` to "Internal Server Error" — not worth showing.
  if (props.error.message && props.error.message !== 'Internal Server Error') {
    return props.error.message;
  }

  return 'An unexpected error occurred. Please try again.';
});

const formattedError = computed(() =>
  JSON.stringify(
    {
      statusCode: props.error.statusCode,
      statusMessage: props.error.statusMessage,
      message: props.error.message
    },
    null,
    2
  )
);

function refreshPage() {
  reloadNuxtApp();
}

function goHome() {
  clearError({ redirect: '/' });
}
</script>

<style scoped>
.details {
  max-height: 200px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
