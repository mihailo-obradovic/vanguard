<template>
  <!-- * Centred by default because every call site sits in a CardDialog body, which lays its children out in a stretching flex column -->
  <v-btn
    class="text-none align-self-center"
    color="link"
    size="small"
    variant="text"
  >
    <slot />
  </v-btn>
</template>
