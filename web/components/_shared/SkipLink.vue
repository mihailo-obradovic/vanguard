<template>
  <!-- * Off-screen until focused, so keyboard users can jump past the navbar. -->
  <a
    href="#main-content"
    class="bg-popover text-primary focus:ring-ring sr-only rounded-md px-4 py-2 font-medium focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[2000] focus:ring-2"
  >
    {{ $t('common.skipToContent') }}
  </a>
</template>
