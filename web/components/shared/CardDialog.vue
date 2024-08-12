<template>
  <v-dialog v-model="dialog" :width="width">
    <v-card color="background">
      <v-card-title class="pa-2 pb-1">
        <slot name="title">{{ title }}</slot>
      </v-card-title>

      <v-card-text :class="['px-2', 'py-1', { scrollable: scrollable }]">
        <slot name="default" />
      </v-card-text>

      <v-card-actions class="pa-2 pt-1">
        <slot name="actions">
          <v-row no-gutters class="d-flex">
            <v-col class="pe-1">
              <v-btn
                block
                color="primary"
                variant="outlined"
                @click="emit('cancel')"
              >
                Cancel
              </v-btn>
            </v-col>

            <v-col class="ps-1">
              <v-btn
                :disabled="confirmDisabled"
                block
                color="primary"
                variant="flat"
                @click="emit('confirm')"
              >
                Confirm
              </v-btn>
            </v-col>
          </v-row>
        </slot>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },

  width: {
    type: String,
    default: '450px'
  },

  scrollable: {
    type: Boolean,
    default: false
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

<style scoped>
/* TODO: Expand functionality */
.scrollable {
  max-height: 80vh;
  overflow-y: auto;
  border-top: 1px solid rgba(var(--v-theme-secondary), 0.25);
  border-bottom: 1px solid rgba(var(--v-theme-secondary), 0.25);
}
</style>
