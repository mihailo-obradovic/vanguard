<template>
  <v-dialog v-model="dialog" :width="width">
    <v-card color="background">
      <v-card-title class="pa-4 pb-2">
        <slot name="title">{{ title }}</slot>
      </v-card-title>

      <v-card-text :class="['px-4', 'py-2', { scrollable: scrollable }]">
        <slot name="default" />
      </v-card-text>

      <v-card-actions class="pa-4 pt-2">
        <slot name="actions">
          <v-row no-gutters class="d-flex ga-4">
            <v-col>
              <v-btn block variant="outlined" @click="emit('cancel')">
                Cancel
              </v-btn>
            </v-col>

            <v-col>
              <v-btn
                :disabled="confirmDisabled"
                :loading="isLoading"
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

const { isLoading } = storeToRefs(useLoadingStore());
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
