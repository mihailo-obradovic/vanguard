<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { Primitive } from 'reka-ui';
import { cn } from '@/lib/utils';

// * Changes: renders through Reka's `Primitive` so the heading level can be chosen, the way the
// * vendored `Button` already takes an `as`.
// * Default: a hardcoded `<h3>`.
// ! `h3` stays the default, so nothing that does not ask changes. But a card that IS the page —
// ! the auth screens — needs `h1`: its title is the only heading there, and shipping it as `h3`
// ! skips two levels for anyone navigating by headings.
const props = withDefaults(
  defineProps<
    PrimitiveProps & {
      class?: HTMLAttributes['class'];
    }
  >(),
  { as: 'h3' }
);
</script>

<template>
  <Primitive
    :as="props.as"
    :as-child="props.asChild"
    data-slot="card-title"
    :class="cn('leading-none font-semibold', props.class)"
  >
    <slot />
  </Primitive>
</template>
