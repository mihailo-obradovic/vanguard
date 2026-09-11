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
    * ! This project's scrolling region is `UIScrollArea`, which marks whichever edge is currently
    * ! hiding content (`catalyst/stacks/frontend/_common/scroll-affordance.md`). Leaving
    * ! `overflow-auto` here nests a second scroll container inside it, which both defeats that
    * ! affordance and breaks the sticky header, since the header would stick to the inner
    * ! container rather than the region the user actually scrolls.
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
