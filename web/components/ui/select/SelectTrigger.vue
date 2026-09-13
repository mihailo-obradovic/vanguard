<script setup lang="ts">
import type { SelectTriggerProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { ChevronDown } from '@lucide/vue';
import { reactiveOmit } from '@vueuse/core';
import { SelectIcon, SelectTrigger, useForwardProps } from 'reka-ui';
import { cn } from '@/lib/utils';

const props = withDefaults(
  defineProps<
    SelectTriggerProps & {
      class?: HTMLAttributes['class'];
      size?: 'sm' | 'default';
      // * New prop — see the `on-primary` branch below.
      variant?: 'default' | 'on-primary';
    }
  >(),
  { size: 'default', variant: 'default' }
);

const delegatedProps = reactiveOmit(props, 'class', 'size', 'variant');
const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <SelectTrigger
    data-slot="select-trigger"
    :data-size="size"
    v-bind="forwardedProps"
    :class="
      cn(
        `border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4`,
        /* * New variant — the trigger sitting ON a primary-filled surface (the navbar), matching
         * `buttonVariants`' `on-primary`. It has to live here rather than at the call site: the
         * chevron rule above is `[&_svg:not([class*='text-'])]`, which outranks a plain
         * `[&_svg]` override on specificity, so the icon kept its muted colour — 1.03:1 on that
         * fill, invisible rather than quiet. Declared here, `cn` merges the two into one. */
        /* * The `dark:` pair overrides the base's `dark:bg-input/30` and `dark:hover:bg-input/50`, which lay the input's grey over the dark face's lavender bar at 4.13:1 resting and 3.18:1 hovered — transparent holds 5.90:1 and the bar's own 10% tint 5.08:1. */
        variant === 'on-primary' &&
          `border-primary-foreground/60 text-primary-foreground hover:bg-primary-foreground/10 dark:bg-transparent dark:hover:bg-primary-foreground/10 [&_svg:not([class*='text-'])]:text-primary-foreground`,
        props.class
      )
    "
  >
    <slot />
    <SelectIcon as-child>
      <ChevronDown class="size-4 opacity-50" />
    </SelectIcon>
  </SelectTrigger>
</template>
