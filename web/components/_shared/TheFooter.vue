<template>
  <footer class="footer">
    {{ $t('common.footer.copyright', { year: currentYear }) }}
  </footer>
</template>

<script setup lang="ts">
import { Temporal } from 'temporal-polyfill';

const currentYear = Temporal.Now.plainDateISO().year;
</script>

<style scoped>
.footer {
  padding: 8px;
  text-align: center;
  background-color: var(--color-brand);
  border-top: 1px solid var(--color-rule);
  color: var(--color-on-brand);
}
</style>
