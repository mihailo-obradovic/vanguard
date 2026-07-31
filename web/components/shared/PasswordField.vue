<template>
  <v-text-field
    v-model="model"
    :type="visible ? 'text' : 'password'"
    :append-inner-icon="visible ? mdiEyeOff : mdiEye"
    @click:append-inner="visible = !visible"
  />
</template>

<script setup lang="ts">
import { mdiEye, mdiEyeOff } from '@mdi/js';

const model = defineModel<string>({ required: true });

// Bind the same `visible` model to several fields (e.g. a password and its
// confirmation) so toggling any one of them reveals the whole group.
const visible = defineModel<boolean>('visible', { default: false });
</script>
