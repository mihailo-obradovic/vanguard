<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { computed } from 'vue';
import { cn } from '@/lib/utils';

const props = defineProps<{
  class?: HTMLAttributes['class'];
  errors?: Array<string | { message: string | undefined } | undefined>;
}>();

const content = computed(() => {
  if (!props.errors || props.errors.length === 0) return null;

  const uniqueErrors = [
    ...new Map(
      props.errors.filter(Boolean).map((error) => {
        const message = typeof error === 'string' ? error : error?.message;
        return [message, error];
      })
    ).values()
  ];

  if (uniqueErrors.length === 1 && uniqueErrors[0]) {
    return typeof uniqueErrors[0] === 'string'
      ? uniqueErrors[0]
      : uniqueErrors[0].message;
  }

  return uniqueErrors.map((error) =>
    typeof error === 'string' ? error : error?.message
  );
});
</script>

<template>
  <!--
    * Changes: renders unconditionally, and reserves two lines of height.
    * Default: `v-if="$slots.default || content"` plus `'text-destructive text-sm font-normal'`.
    *
    * ! Upstream unmounts this element when the field is valid, which moves every field below it —
    * ! and the submit button under the pointer about to press it — the moment a message appears
    * ! (`catalyst/stacks/frontend/_common/layout-stability.md`). Two lines, not one: server 422s
    * ! arrive as full sentences and the sr-Cyrl catalog runs longer than the English one, so a
    * ! one-line reservation is correct until the first message wraps inside a 400px card. The
    * ! height is derived from the line height rather than written as a pixel constant — the
    * ! constant is right at one width and wrong at the rest, and silently stops matching the next
    * ! time the type scale moves. Declaring the line height as a variable keeps one source for
    * ! both values, as the `UIField` this replaces did.
  -->
  <div
    role="alert"
    data-slot="field-error"
    :class="
      cn(
        'text-destructive text-sm font-normal',
        '[--error-line-height:1.3] leading-(--error-line-height) min-h-[calc(2*var(--error-line-height)*1em)]',
        props.class
      )
    "
  >
    <slot v-if="$slots.default" />

    <template v-else-if="typeof content === 'string'">
      {{ content }}
    </template>

    <ul
      v-else-if="Array.isArray(content)"
      class="ml-4 flex list-disc flex-col gap-1"
    >
      <li v-for="(error, index) in content" :key="index">
        {{ error }}
      </li>
    </ul>
  </div>
</template>
