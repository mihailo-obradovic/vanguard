<template>
  <!-- * A toggle button, so the name stays fixed and `aria-pressed` carries the state — a label that flipped between "dark" and "light" would contradict the pressed state it sits beside. -->
  <Button
    variant="on-primary"
    size="icon"
    :aria-label="$t('common.darkMode')"
    :aria-pressed="isDark"
    @click="toggle"
  >
    <Moon v-if="isDark" />

    <Sun v-else />
  </Button>
</template>

<script setup lang="ts">
import { Moon, Sun } from '@lucide/vue';

import { Button } from '@/components/ui/button';

const colorMode = useColorMode();

const isDark = computed(() => colorMode.value === 'dark');

// * Writes `preference`, not `value`: `value` is resolved from it, and `preference` is what the module persists.
function toggle() {
  colorMode.preference = isDark.value ? 'light' : 'dark';
}
</script>
