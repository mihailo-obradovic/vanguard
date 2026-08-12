<template>
  <v-dialog v-model="dialog" fullscreen>
    <v-sheet class="h-100 d-flex flex-column" @keydown.enter="handleEnterKey">
      <v-toolbar flat color="primary" class="px-2">
        <v-toolbar-items>
          <v-btn icon @click="emit('cancel')">
            <v-icon :icon="mdiClose" />
          </v-btn>
        </v-toolbar-items>

        <v-toolbar-title class="font-weight-medium text-white">
          {{ title }}
        </v-toolbar-title>

        <v-spacer />

        <v-toolbar-items>
          <v-btn
            :disabled="confirmDisabled"
            :loading="loading"
            icon
            @click="emit('confirm')"
          >
            <v-icon :icon="mdiContentSave" />
          </v-btn>
        </v-toolbar-items>
      </v-toolbar>

      <GapContainer column class="pa-4 flex-grow-1 overflow-y-auto">
        <slot name="default" />
      </GapContainer>
    </v-sheet>
  </v-dialog>
</template>

<script setup lang="ts">
import { mdiClose, mdiContentSave } from '@mdi/js';

const props = withDefaults(
  defineProps<{
    title: string;
    confirmDisabled?: boolean;
    loading?: boolean;
  }>(),
  {
    confirmDisabled: false,
    loading: false
  }
);

const dialog = defineModel<boolean>({ required: true });

const emit = defineEmits<{
  cancel: [];
  confirm: [];
}>();

function handleEnterKey(event: KeyboardEvent) {
  if (props.confirmDisabled || props.loading) {
    return;
  }

  // * Interactive elements handle Enter themselves (buttons click, selects toggle their menu); confirming here too would double-fire
  if ((event.target as HTMLElement).closest('button, a, textarea, .v-select')) {
    return;
  }

  emit('confirm');
}
</script>
