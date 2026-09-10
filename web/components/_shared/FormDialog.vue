<template>
  <Dialog v-model:open="dialog">
    <DialogContent
      class="flex max-h-[calc(100vh-4rem)] flex-col gap-0 p-0"
      :show-close-button="false"
      @keydown.enter="confirmFromEnter"
      @after-leave="emit('afterLeave')"
    >
      <DialogHeader class="p-6 pb-2">
        <DialogTitle>
          <slot name="title">{{ title }}</slot>
        </DialogTitle>
      </DialogHeader>

      <UIScrollArea class="min-h-0 flex-1 px-6 py-2">
        <div class="flex flex-col gap-4">
          <slot />
        </div>
      </UIScrollArea>

      <DialogFooter class="p-6 pt-4">
        <slot name="actions">
          <Button variant="outline" class="flex-1" @click="emit('cancel')">
            {{ $t('common.actions.cancel') }}
          </Button>

          <Button
            :disabled="confirmDisabled || loading"
            class="flex-1"
            @click="emit('confirm')"
          >
            <Loader2 v-if="loading" class="size-4 animate-spin" />
            {{ $t('common.actions.confirm') }}
          </Button>
        </slot>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { Loader2 } from '@lucide/vue';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

// ! Stryker instruments this block with locally declared coverage helpers, and a compiler
// ! macro is hoisted out of setup() — referencing them there is a compile error, not a
// ! warning. The defaults inside go unmutated as a result (`catalyst/operations.md`).
// Stryker disable all
const props = withDefaults(
  defineProps<{
    title: string;
    confirmDisabled?: boolean;
    loading?: boolean;
    confirmOnEnter?: boolean;
  }>(),
  {
    confirmDisabled: false,
    loading: false,
    confirmOnEnter: true
  }
);

const dialog = defineModel<boolean>({ required: true });

const emit = defineEmits<{
  cancel: [];
  confirm: [];
  // * Fires once the close transition has finished (Reka UI's `after-leave` Presence
  // * event) — the safe moment for owners to clear state the dialog was rendering.
  afterLeave: [];
}>();
// Stryker restore all

const confirmFromEnter = useConfirmOnEnter(
  () => emit('confirm'),
  () => props.confirmOnEnter && !props.confirmDisabled && !props.loading
);
</script>
