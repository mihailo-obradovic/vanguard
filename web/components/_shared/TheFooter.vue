<template>
  <footer
    class="bg-elevated/50 border-default text-muted border-t p-3 text-center text-sm"
  >
    {{ $t('common.footer.copyright', { year: currentYear }) }}
  </footer>
</template>

<script setup lang="ts">
import { Temporal } from 'temporal-polyfill';

const currentYear = Temporal.Now.plainDateISO().year;
</script>
