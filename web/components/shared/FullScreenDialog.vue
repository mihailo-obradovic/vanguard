<template>
  <v-dialog v-model="dialog" fullscreen>
    <v-sheet>
      <v-toolbar flat color="primary" class="px-2">
        <v-toolbar-items>
          <v-btn icon @click="emit('cancel')">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar-items>

        <v-toolbar-title class="font-weight-medium text-white">
          {{ title }}
        </v-toolbar-title>

        <v-spacer />

        <v-toolbar-items>
          <v-btn :disabled="confirmDisabled" icon @click="emit('confirm')">
            <v-icon>mdi-content-save</v-icon>
          </v-btn>
        </v-toolbar-items>
      </v-toolbar>

      <GapContainer column class="pa-4">
        <slot name="default" />
      </GapContainer>
    </v-sheet>
  </v-dialog>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },

  confirmDisabled: {
    type: Boolean,
    default: false
  }
});

const dialog = defineModel({
  type: Boolean,
  required: true
});

const emit = defineEmits(['cancel', 'confirm']);
</script>
