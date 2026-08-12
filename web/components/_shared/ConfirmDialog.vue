<template>
  <CardDialog
    v-model="dialog"
    :title="title"
    :loading="loading"
    :fullscreen-on-mobile="false"
    :confirm-on-enter="false"
    @cancel="emit('cancel')"
    @confirm="emit('confirm')"
  >
    <p class="text-body-2">{{ message }}</p>
  </CardDialog>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    message: string;
    loading?: boolean;
  }>(),
  {
    title: 'Are you sure?',
    loading: false
  }
);

const emit = defineEmits<{
  cancel: [];
  confirm: [];
}>();

const dialog = defineModel<boolean>({ required: true });
</script>
