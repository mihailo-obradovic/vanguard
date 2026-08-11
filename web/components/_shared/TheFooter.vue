<template>
  <v-footer app elevation="2" class="justify-center">
    Copyright ©, Vanguard {{ currentYear }}
  </v-footer>
</template>

<script setup lang="ts">
import { Temporal } from 'temporal-polyfill';

const currentYear = Temporal.Now.plainDateISO().year;
</script>
