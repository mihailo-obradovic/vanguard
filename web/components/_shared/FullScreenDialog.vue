<template>
  <v-dialog v-model="dialog" fullscreen>
    <v-sheet class="h-100 d-flex flex-column" @keydown.enter="handleEnterKey">
      <v-toolbar flat color="primary" class="px-2">
        <v-toolbar-items>
          <v-btn
            :aria-label="$t('common.actions.close')"
            icon
            @click="emit('cancel')"
          >
            <v-icon :icon="mdiClose" />
          </v-btn>
        </v-toolbar-items>

        <v-toolbar-title class="font-weight-medium text-white">
          {{ title }}
        </v-toolbar-title>

        <v-spacer />

        <v-toolbar-items>
          <v-btn
            :aria-label="$t('common.actions.save')"
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

// ! Stryker instruments this block with locally declared coverage helpers, and a compiler
// ! macro is hoisted out of setup() — referencing them there is a compile error, not a
// ! warning. The defaults inside go unmutated as a result (`catalyst/operations.md`).
// Stryker disable all
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
// Stryker restore all

// ! No `confirmOnEnter` opt-out here, unlike FormCard: this dialog's toolbar save is its only confirm affordance.
const handleEnterKey = useConfirmOnEnter(
  () => emit('confirm'),
  () => !props.confirmDisabled && !props.loading
);
</script>
