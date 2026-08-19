<template>
  <!-- * Off-screen until focused, so keyboard users can jump past the navbar. `sr-only` alone would not do: it has to become visible on focus, which is what the focus: pair restores. -->
  <a
    href="#main-content"
    class="ring-default bg-default text-primary absolute left-[-9999px] z-50 rounded-md px-4 py-2 font-medium ring focus:top-4 focus:left-4"
  >
    {{ $t('common.skipToContent') }}
  </a>
</template>
