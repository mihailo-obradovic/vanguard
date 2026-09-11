<template>
  <footer class="bg-primary text-primary-foreground p-2 text-center">
    {{ $t('common.footer.copyright', { year: currentYear }) }}
  </footer>
</template>

<script setup lang="ts">
import { Temporal } from 'temporal-polyfill';

const currentYear = Temporal.Now.plainDateISO().year;
</script>
