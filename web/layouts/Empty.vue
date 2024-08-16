<template>
  <div class="layout">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.layout {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  background: rgb(var(--v-theme-background));
}
</style>
