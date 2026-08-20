<template>
  <!-- * Chrome on the branded bar: ghost so the bar's own colour shows through, and inheriting its text colour rather than the neutral one. -->
  <u-select
    v-model="selected"
    :items="items"
    value-key="value"
    color="neutral"
    variant="ghost"
    :aria-label="$t('common.language')"
    class="text-inverted hover:bg-inverted/10"
    :ui="{ trailingIcon: 'text-inverted' }"
  />
</template>

<script setup lang="ts">
import { breakpointsTailwind } from '@vueuse/core';

const { locale, locales, setLocale } = useI18n();

const breakpoints = useBreakpoints(breakpointsTailwind);

const isCompactHeader = breakpoints.smaller('sm');

const items = computed(() =>
  locales.value.map((option) => ({
    // * `short` is a custom locale property (`nuxt.config.ts`), so the module hands it back as `unknown`.
    label: isCompactHeader.value ? (option.short as string) : option.name,
    value: option.code
  }))
);

// * Writing through setLocale rather than to `locale` directly is what persists the choice to the detection cookie.
const selected = computed({
  get: () => locale.value,
  set: (code) => setLocale(code)
});
</script>
