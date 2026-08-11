<template>
  <a href="#main-content" class="skip-link">Skip to main content</a>
</template>

<style scoped>
/* * Visually hidden until focused, so keyboard users can jump past the app bar. */
.skip-link {
  position: absolute;
  left: -9999px;
  z-index: 2000;
  background-color: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-primary));
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
