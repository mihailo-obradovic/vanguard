<template>
  <v-layout class="w-100 h-100">
    <v-main class="w-100 h-100">
      <v-container
        fluid
        class="w-100 h-100 d-flex flex-column justify-center align-center"
      >
        <slot />
      </v-container>
    </v-main>
  </v-layout>
</template>

<style lang="scss" scoped>
html {
  height: 100%;
}
</style>
