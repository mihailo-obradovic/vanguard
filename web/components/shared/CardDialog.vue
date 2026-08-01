<template>
  <v-dialog v-model="dialog" :width="width">
    <v-card color="background">
      <v-card-title class="pa-4 pb-2">
        <slot name="title">{{ title }}</slot>
      </v-card-title>

      <v-card-text :class="['px-4', 'py-2', { scrollable: scrollable }]">
        <GapContainer column>
          <slot name="default" />
        </GapContainer>
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
                :loading="loading"
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

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    width?: string;
    scrollable?: boolean;
    confirmDisabled?: boolean;
    loading?: boolean;
  }>(),
  {
    width: '450px',
    scrollable: false,
    confirmDisabled: false,
    loading: false
  }
);

const dialog = defineModel<boolean>({ required: true });

const emit = defineEmits<{
  cancel: [];
  confirm: [];
}>();
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
