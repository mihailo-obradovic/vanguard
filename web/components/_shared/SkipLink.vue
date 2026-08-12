<template>
  <a href="#main-content" class="skip-link">{{ $t('common.skipToContent') }}</a>
</template>

<style scoped>
/* * Visually hidden until focused, so keyboard users can jump past the navbar. */
.skip-link {
  position: absolute;
  left: -9999px;
  z-index: 2000;
  background-color: white;
  color: rgb(0, 102, 255);
  padding: 8px 16px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
}

.skip-link:focus {
  left: 16px;
  top: 16px;
}
</style>
