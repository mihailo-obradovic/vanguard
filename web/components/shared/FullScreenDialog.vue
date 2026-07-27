<template>
  <v-dialog v-model="dialog" fullscreen>
    <v-sheet>
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
          <v-btn :disabled="confirmDisabled" icon @click="emit('confirm')">
            <v-icon :icon="mdiContentSave" />
          </v-btn>
        </v-toolbar-items>
      </v-toolbar>

      <GapContainer column class="pa-4">
        <slot name="default" />
      </GapContainer>
    </v-sheet>
  </v-dialog>
</template>

<script setup lang="ts">
import { mdiClose, mdiContentSave } from '@mdi/js';

defineProps<{
  title: string;
  confirmDisabled?: boolean;
}>();

const dialog = defineModel<boolean>({ required: true });

const emit = defineEmits<{
  cancel: [];
  confirm: [];
}>();
</script>
