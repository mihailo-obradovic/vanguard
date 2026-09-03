<template>
  <!-- * Nuxt UI's own form field, with the half of the error transition the library cannot express: it unmounts the message the instant the error clears, so nothing is left on screen to animate out. This holds the last message for the length of the exit animation and hands it that animation through `ui.error`. Both halves of the transition, and its duration, are named in `config/nuxt-ui/form-field.ts` — what belongs here is only *when* they run. -->
  <!-- ! Deliberately named `UFormField`, so it shadows the library's component of that name and every call site stays an ordinary `<u-form-field>`. Renaming this file un-shadows it and silently restores the un-animated field everywhere. -->
  <nuxt-ui-form-field v-bind="$attrs" :error="displayedError" :ui="fieldUi">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </nuxt-ui-form-field>
</template>

<script setup lang="ts">
import NuxtUiFormField from '@nuxt/ui/components/FormField.vue';

import {
  ERROR_EXIT_ANIMATION,
  ERROR_TRANSITION_MS
} from '@/config/nuxt-ui/form-field';

import type { FormFieldProps } from '@nuxt/ui/components/FormField.vue';

// * Taken from the component being wrapped, so a slot renamed upstream fails here rather than at a call site.
type FieldUi = FormFieldProps['ui'];

// ! A compiler macro's arguments are hoisted out of setup(), away from Stryker's locally declared helpers — instrumenting them is a compile error here (`catalyst/operations.md`).
// Stryker disable all
defineOptions({ inheritAttrs: false });
// Stryker restore all

// * The only two props the wrapper reads. Everything else the field accepts rides `$attrs` untouched.
const props = defineProps<{
  error?: FormFieldProps['error'];
  ui?: FieldUi;
}>();

const displayedError = ref(props.error);
const isLeaving = ref(false);

const { start, stop } = useTimeoutFn(
  () => {
    isLeaving.value = false;
    // * Whatever the field settles on — an absent error, or the `false` that suppresses the slot outright.
    displayedError.value = props.error;
  },
  ERROR_TRANSITION_MS,
  { immediate: false }
);

// * Appended rather than replacing, so tailwind-merge drops only the enter animation it collides with and any `ui.error` a call site passed survives.
const fieldUi = computed<FieldUi | undefined>(() => {
  if (!isLeaving.value) {
    return props.ui;
  }

  return {
    ...props.ui,
    error: [props.ui?.error, ERROR_EXIT_ANIMATION].filter(Boolean).join(' ')
  };
});

watch(
  () => props.error,
  (error) => {
    if (typeof error === 'string' && error) {
      stop();
      isLeaving.value = false;
      displayedError.value = error;

      return;
    }

    // * Nothing on screen to play out — a field that never errored, or one already mid-exit.
    if (!displayedError.value || isLeaving.value) {
      return;
    }

    isLeaving.value = true;
    start();
  }
);
</script>
