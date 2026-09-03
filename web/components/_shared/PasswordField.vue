<template>
  <v-text-field v-model="model" :type="visible ? 'text' : 'password'">
    <!-- * A real button rather than `append-inner-icon`: that renders a bare icon, which no
         * screen reader announces and no keyboard reaches. -->
    <template #append-inner>
      <v-btn
        :aria-label="
          visible
            ? $t('common.actions.hidePassword')
            : $t('common.actions.showPassword')
        "
        :icon="visible ? mdiEyeOff : mdiEye"
        density="compact"
        variant="text"
        @click="visible = !visible"
      />
    </template>

    <!-- * Everything else a caller wants to place inside the field — the details slot above all, which is where a reserved hint goes — passes straight through. -->
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </v-text-field>
</template>

<script setup lang="ts">
import { mdiEye, mdiEyeOff } from '@mdi/js';

// ! Stryker instruments this block with locally declared coverage helpers, and a compiler
// ! macro is hoisted out of setup() — referencing them there is a compile error, not a
// ! warning. The defaults inside go unmutated as a result (`catalyst/operations.md`).
// Stryker disable all
const model = defineModel<string>({ required: true });

// * Bind the same `visible` model to several fields (e.g. a password and its confirmation) so toggling any one of them reveals the whole group.
const visible = defineModel<boolean>('visible', { default: false });
// Stryker restore all
</script>
