<template>
  <v-layout class="layout">
    <slot />
  </v-layout>
</template>

<style lang="scss" scoped>
.layout {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  background: rgb(var(--v-theme-secondary));
}
</style>
