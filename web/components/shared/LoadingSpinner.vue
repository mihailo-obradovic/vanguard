<template>
  <div class="spinner-wrapper">
    <v-progress-circular
      :indeterminate="isLoading"
      color="primary"
      :class="classList"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  fillHeight?: boolean;
}>();

const isLoading = defineModel<boolean>({ required: true });

const classList = computed(() => {
  return {
    'z-index-top': true,
    'fill-height': props.fillHeight
  };
});
</script>

<style scoped lang="scss">
.spinner-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  width: 100%;
}

.fill-height {
  height: calc(100vh); // TODO: Update with a dynamic value
}
</style>
