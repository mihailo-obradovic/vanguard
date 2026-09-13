<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/lib/utils';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <!--
    * Changes: the container no longer scrolls.
    * Default: `class="relative w-full overflow-auto"`.
    *
    * ! The page owns the scrolling region — a height-capped flex child around the table
    * ! (`catalyst/stacks/frontend/nuxt/page-layout.md`). Leaving `overflow-auto` here nests a
    * ! second scroll container inside it, which breaks the sticky header: the header would stick
    * ! to this unbounded inner container rather than the region the user actually scrolls.
  -->
  <div data-slot="table-container" class="relative w-full">
    <table
      data-slot="table"
      :class="cn('w-full caption-bottom text-sm', props.class)"
    >
      <slot />
    </table>
  </div>
</template>
