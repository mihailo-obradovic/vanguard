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
                {{ $t('errors.page.refresh') }}
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
                {{ $t('errors.page.goHome') }}
              </v-btn>
            </v-col>
          </v-row>

          <v-expansion-panels>
            <v-expansion-panel
              bg-color="background"
              :title="$t('errors.page.technicalDetails')"
            >
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

const { t } = useI18n();

const title = computed(() =>
  props.error.statusCode === 404
    ? t('errors.page.notFoundTitle')
    : t('errors.page.unexpectedTitle')
);

const message = computed(() => {
  if (props.error.statusCode === 404) {
    return t('errors.page.notFoundMessage');
  }

  // * Nuxt defaults `message` to "Internal Server Error" — not worth showing.
  if (props.error.message && props.error.message !== 'Internal Server Error') {
    return props.error.message;
  }

  return t('errors.page.unexpectedMessage');
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
