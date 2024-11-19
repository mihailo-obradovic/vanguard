<template>
  <div class="spinner-wrapper">
    <v-progress-circular
      :indeterminate="isLoading"
      color="primary"
      class="z-index-top"
    />
  </div>
</template>

<script setup>
const isLoading = defineModel({
  type: Boolean,
  required: true
});
</script>

<style scoped lang="scss">
.spinner-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  width: 100%;
  height: calc(100vh); // TODO: Update with a dynamic value
}
</style>
