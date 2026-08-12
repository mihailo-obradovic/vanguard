<template>
  <CardDialog
    v-model="dialog"
    :title="title ?? $t('common.confirmTitle')"
    :loading="loading"
    :fullscreen-on-mobile="false"
    :confirm-on-enter="false"
    :confirm-color="destructive ? 'error' : 'primary'"
    @cancel="emit('cancel')"
    @confirm="emit('confirm')"
    @after-leave="emit('after-leave')"
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
    destructive?: boolean;
  }>(),
  { loading: false, destructive: false }
);

const emit = defineEmits<{
  cancel: [];
  confirm: [];
  'after-leave': [];
}>();

const dialog = defineModel<boolean>({ required: true });
</script>
