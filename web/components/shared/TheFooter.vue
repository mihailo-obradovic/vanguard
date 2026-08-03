<template>
  <footer class="footer">Copyright ©, Vanguard {{ currentYear }}</footer>
</template>

<script setup lang="ts">
import { Temporal } from 'temporal-polyfill';

const currentYear = Temporal.Now.plainDateISO().year;
</script>

<style scoped>
.footer {
  padding: 8px;
  text-align: center;
  background-color: rgb(0, 102, 255);
  border-top: 1px solid #000000;
  color: white;
}
</style>
