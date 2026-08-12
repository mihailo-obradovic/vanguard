<template>
  <v-menu>
    <template #activator="{ props: activatorProps }">
      <v-btn
        v-bind="activatorProps"
        icon
        :aria-label="$t('common.language')"
        :title="$t('common.language')"
      >
        <v-icon :icon="mdiTranslate" />
      </v-btn>
    </template>

    <v-list density="compact">
      <v-list-item
        v-for="option in locales"
        :key="option.code"
        :active="option.code === locale"
        :title="option.name"
        @click="setLocale(option.code)"
      />
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
import { mdiTranslate } from '@mdi/js';

// * setLocale rather than assigning to `locale` — it is what persists the choice to the detection cookie.
const { locale, locales, setLocale } = useI18n();
</script>
