<template>
  <!-- * Off-screen until focused, so keyboard users can jump past the navbar. `sr-only` alone would not do: it has to become visible on focus, which is what the focus: pair restores. -->
  <a
    href="#main-content"
    class="absolute left-[-9999px] z-50 rounded-md bg-default px-4 py-2 font-medium text-primary ring ring-default focus:top-4 focus:left-4"
  >
    {{ $t('common.skipToContent') }}
  </a>
</template>
